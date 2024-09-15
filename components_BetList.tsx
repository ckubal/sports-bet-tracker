import React, { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DollarSign, Trophy, X, User, Plus, Edit2, Copy, Trash2 } from 'lucide-react'
import { BetForm } from './BetForm'
import { Modal } from './Modal'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import ReactConfetti from 'react-confetti'
import { FallingEmojis } from './FallingEmojis'

interface Bet {
  id: number
  bet: string
  game: string
  cost: number
  winAmount: number
  status: 'open' | 'won' | 'lost'
  participants: string[]
  participantShares: { [key: string]: number }
  placedBy: string
  createdAt: Date
}

interface ParticipantStats {
  netWinnings: number
  moneyInPlay: number
}

const initialBets: Bet[] = [
  // ... (previous bet data)
]

const getInitials = (name: string) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase()
  return initials.slice(0, 2)
}

const getStatusIcon = (status: Bet['status']) => {
  switch (status) {
    case 'open':
      return <Badge variant="outline" className="ml-2">Open</Badge>
    case 'won':
      return <Trophy className="h-4 w-4 text-green-700 ml-2" />
    case 'lost':
      return <X className="h-4 w-4 text-red-700 ml-2" />
  }
}

const getCardBackground = (status: Bet['status']) => {
  switch (status) {
    case 'won':
      return 'bg-green-100'
    case 'lost':
      return 'bg-red-100'
    default:
      return 'bg-white'
  }
}

const formatDate = (date: Date) => {
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  return `${time} ${dateStr}`;
}

const StatusIcon = ({ letter, isActive, onClick, ariaLabel }) => (
  <Button
    size="sm"
    variant="ghost"
    onClick={onClick}
    aria-label={ariaLabel}
    className={`w-6 h-6 p-0 rounded-full border ${
      isActive 
        ? letter === 'W' 
          ? 'border-green-700 text-green-700' 
          : 'border-red-700 text-red-700'
        : 'border-gray-400 text-gray-400'
    }`}
  >
    <span className="text-xs font-bold">{letter}</span>
  </Button>
)

const calculatePercentages = (shares: { [key: string]: number } | undefined) => {
  if (!shares) return {}
  const total = Object.values(shares).reduce((sum, share) => sum + share, 0)
  return Object.entries(shares).reduce((acc, [name, share]) => {
    acc[name] = share / total
    return acc
  }, {} as { [key: string]: number })
}

const shouldShowParticipants = (shares: { [key: string]: number } | undefined) => {
  if (!shares) return false
  const percentages = calculatePercentages(shares)
  const values = Object.values(percentages)
  const min = Math.min(...values)
  const max = Math.max(...values)
  return max - min > 0.1
}

export default function BetList() {
  const [bets, setBets] = useState<Bet[]>(initialBets)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBet, setEditingBet] = useState<Bet | null>(null)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [recentGames, setRecentGames] = useState<string[]>([])
  const [recentParticipants, setRecentParticipants] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFallingEmojis, setShowFallingEmojis] = useState(false)

  useEffect(() => {
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    
    const games = bets
      .filter(bet => bet.createdAt >= fourDaysAgo)
      .map(bet => bet.game)
    
    setRecentGames([...new Set(games)].slice(0, 8))

    const participants = bets
      .filter(bet => bet.createdAt >= fourDaysAgo)
      .flatMap(bet => bet.participants)
    
    setRecentParticipants([...new Set(participants)].slice(0, 8))
  }, [bets])

  const calculateParticipantStats = (): { [key: string]: ParticipantStats } => {
    const stats: { [key: string]: ParticipantStats } = {}

    bets.forEach(bet => {
      const percentages = calculatePercentages(bet.participantShares)
      bet.participants.forEach(participant => {
        if (!stats[participant]) {
          stats[participant] = { netWinnings: 0, moneyInPlay: 0 }
        }

        const share = percentages[participant] || 0

        if (bet.status === 'won') {
          stats[participant].netWinnings += bet.winAmount * share
        } else if (bet.status === 'lost') {
          stats[participant].netWinnings -= bet.cost * share
        } else if (bet.status === 'open') {
          stats[participant].moneyInPlay += bet.cost * share
        }
      })
    })

    return stats
  }

  const participantStats = calculateParticipantStats()
  const sortedParticipants = Object.entries(participantStats).sort((a, b) => b[1].netWinnings - a[1].netWinnings)

  const handleAddBet = (newBet: Omit<Bet, 'id' | 'createdAt' | 'status'>) => {
    const id = Math.max(...bets.map(bet => bet.id), 0) + 1
    const createdAt = new Date()
    setBets([{ ...newBet, id, createdAt, status: 'open' }, ...bets])
    setIsModalOpen(false)
  }

  const handleEditBet = (updatedBet: Omit<Bet, 'id' | 'createdAt'>) => {
    setBets(bets.map(bet => 
      bet.id === editingBet?.id ? { ...updatedBet, id: bet.id, createdAt: bet.createdAt, status: 'open' } : bet
    ))
    setEditingBet(null)
    setIsModalOpen(false)
  }

  const handleStatusChange = (id: number, newStatus: Bet['status']) => {
    setBets(bets.map(bet => 
      bet.id === id ? { ...bet, status: bet.status === newStatus ? 'open' : newStatus } : bet
    ))

    if (newStatus === 'won' && bets.find(bet => bet.id === id)?.status !== 'won') {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 5000)
    } else if (newStatus === 'lost' && bets.find(bet => bet.id === id)?.status !== 'lost') {
      setShowFallingEmojis(true)
      setTimeout(() => setShowFallingEmojis(false), 5000)
    }
  }

  const handleSubmit = (bet: Omit<Bet, 'id' | 'createdAt' | 'status'>) => {
    if (isDuplicating || !editingBet) {
      handleAddBet(bet)
    } else {
      handleEditBet(bet)
    }
    setIsDuplicating(false)
  }

  const handleDuplicateBet = (bet: Bet) => {
    setEditingBet({ ...bet, id: 0 })
    setIsDuplicating(true)
    setIsModalOpen(true)
  }

  const handleDeleteBet = (id: number) => {
    setBets(bets.filter(bet => bet.id !== id))
  }

  const sortedBets = [...bets].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return (
    <div className="container mx-auto p-4 relative min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Sports Bets Tracker</h1>
      
      {showConfetti && <ReactConfetti recycle={false} numberOfPieces={200} />}
      {showFallingEmojis && <FallingEmojis />}

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Participant Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="font-semibold">Participant</div>
            <div className="font-semibold">Net Winnings</div>
            <div className="font-semibold">Money in Play</div>
            {sortedParticipants.map(([participant, stats]) => (
              <React.Fragment key={participant}>
                <div>{participant}</div>
                <div className={stats.netWinnings >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ${stats.netWinnings.toFixed(2)}
                </div>
                <div className="text-blue-600">${stats.moneyInPlay.toFixed(2)}</div>
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false)
        setEditingBet(null)
        setIsDuplicating(false)
      }} title={isDuplicating ? "Duplicate Bet" : (editingBet ? "Edit Bet" : "Add New Bet")}>
        <BetForm 
          onSubmit={handleSubmit} 
          initialBet={editingBet} 
          recentGames={recentGames}
          recentParticipants={recentParticipants}
          isDuplicating={isDuplicating}
        />
      </Modal>

      <div className="space-y-4">
        {sortedBets.map((bet) => (
          <Card key={bet.id} className={`${getCardBackground(bet.status)} transition-colors duration-200`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <h2 className="text-xl font-semibold flex items-center">
                    {bet.bet}
                    {getStatusIcon(bet.status)}
                    {bet.status !== 'open' && (
                      <span className={`ml-2 text-sm ${bet.status === 'won' ? 'text-green-700' : 'text-red-700'}`}>
                        {bet.status === 'won' ? `+$${bet.winAmount.toFixed(2)}` : `-$${bet.cost.toFixed(2)}`}
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">{bet.game}</p>
                  <div className="flex items-center mt-2">
                    <DollarSign className="h-4 w-4 text-gray-600 mr-1" />
                    <span className="text-sm text-gray-700">Bet: ${bet.cost}</span>
                    <Trophy className="h-4 w-4 text-gray-600 ml-4 mr-1" />
                    <span className="text-sm text-gray-700">To Win: ${bet.winAmount}</span>
                  </div>
                  <div className="flex items-center mt-2 text-sm text-gray-700">
                    <User className="h-4 w-4 mr-1" />
                    <span>Placed by: {bet.placedBy}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex -space-x-2 mb-2">
                    {bet.participants.map((participant, index) => (
                      <Avatar key={index} className="border-2 border-background">
                        <AvatarFallback>{getInitials(participant)}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              </div>
              {shouldShowParticipants(bet.participantShares) && (
                <div className="mt-2">
                  <h3 className="text-sm font-semibold mb-1">Participants:</h3>
                  <div className="flex flex-wrap gap-2">
                    {bet.participants.map((participant, index) => {
                      const percentages = calculatePercentages(bet.participantShares)
                      return (
                        <div key={index} className="text-xs bg-gray-100 rounded-full px-2 py-1">
                          {participant} ({((percentages[participant] || 0) * 100).toFixed(0)}%)
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center text-xs text-gray-500">
                  <span>Placed: {formatDate(bet.createdAt)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingBet(bet)
                      setIsModalOpen(true)
                    }}
                    aria-label="Edit bet"
                    className="ml-1 p-1"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDuplicateBet(bet)}
                    aria-label="Duplicate bet"
                    className="ml-1 p-1"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="Delete bet"
                        className="ml-1 p-1"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the bet.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteBet(bet.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="flex space-x-1">
                  <StatusIcon
                    letter="W"
                    isActive={bet.status === 'won'}
                    onClick={() => handleStatusChange(bet.id, 'won')}
                    ariaLabel={bet.status === 'won' ? "Mark as open" : "Mark as won"}
                  />
                  <StatusIcon
                    letter="L"
                    isActive={bet.status === 'lost'}
                    onClick={() => handleStatusChange(bet.id, 'lost')}
                    ariaLabel={bet.status === 'lost' ? "Mark as open" : "Mark as lost"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        className="fixed bottom-6 right-6 rounded-full w-12 h-12 p-0 shadow-lg"
        onClick={() => {
          setEditingBet(null)
          setIsModalOpen(true)
        }}
        aria-label="Add new bet"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}