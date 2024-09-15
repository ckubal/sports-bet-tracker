import React, { useState, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Minus, Plus, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

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

interface BetFormProps {
  onSubmit: (bet: Omit<Bet, 'id' | 'createdAt' | 'status'>) => void
  initialBet?: Bet | null
  recentParticipants?: string[]
  recentGames?: string[]
  isDuplicating: boolean
}

interface Participant {
  name: string;
  share: number;
}

export function BetForm({ onSubmit, initialBet, recentParticipants = [], recentGames = [], isDuplicating }: BetFormProps) {
  const [bet, setBet] = useState(initialBet?.bet || '')
  const [game, setGame] = useState(initialBet?.game || '')
  const [cost, setCost] = useState(initialBet?.cost.toString() || '')
  const [winAmount, setWinAmount] = useState(initialBet?.winAmount.toString() || '')
  const [newParticipant, setNewParticipant] = useState('')
  const [participants, setParticipants] = useState<Participant[]>(
    initialBet?.participants.map(name => ({
      name,
      share: initialBet.participantShares[name] || 0
    })) || []
  )
  const [placedBy, setPlacedBy] = useState(initialBet?.placedBy || '')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showNewParticipantInput, setShowNewParticipantInput] = useState(false)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [showParticipantAlert, setShowParticipantAlert] = useState(false)

  useEffect(() => {
    if (initialBet) {
      setBet(initialBet.bet)
      setGame(initialBet.game)
      setCost(initialBet.cost.toString())
      setWinAmount(initialBet.winAmount.toString())
      setParticipants(initialBet.participants.map(name => ({
        name,
        share: initialBet.participantShares[name] || 0
      })))
      setPlacedBy(initialBet.placedBy)
    }
  }, [initialBet])

  const handleAddParticipant = useCallback((name: string) => {
    if (name.trim() && !participants.some(p => p.name === name.trim())) {
      setParticipants(prevParticipants => {
        const newParticipants = [...prevParticipants, { name: name.trim(), share: 0 }]
        const defaultShare = 100 / newParticipants.length
        return newParticipants.map(p => ({ ...p, share: defaultShare }))
      })
      setShowParticipantAlert(false)
    }
  }, [participants])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddParticipant(newParticipant)
      setNewParticipant('')
      setShowNewParticipantInput(false)
    }
  }

  const handleRemoveParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index))
  }

  const handleParticipantShareChange = (index: number, value: string) => {
    const updatedParticipants = [...participants]
    updatedParticipants[index].share = parseFloat(value) || 0
    setParticipants(updatedParticipants)
  }

  const getInitials = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase()
    return initials.slice(0, 2)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (participants.length === 0) {
      setShowParticipantAlert(true)
      return
    }
    const newBet: Omit<Bet, 'id' | 'createdAt' | 'status'> = {
      bet,
      game,
      cost: parseFloat(cost),
      winAmount: parseFloat(winAmount),
      participants: participants.map(p => p.name),
      participantShares: participants.reduce((acc, p) => ({ ...acc, [p.name]: p.share }), {}),
      placedBy
    }
    onSubmit(newBet)
  }

  const handleGameSelection = (selectedGame: string) => {
    setSelectedGame(selectedGame)
    setGame(selectedGame)
  }

  const handleGameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGame(e.target.value)
    setSelectedGame(null)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bet">Bet</Label>
            <Input
              id="bet"
              value={bet}
              onChange={(e) => setBet(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="game">Game</Label>
            <Input
              id="game"
              value={game}
              onChange={handleGameChange}
              required
            />
            {recentGames.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recentGames.map((recentGame, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={selectedGame === recentGame ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleGameSelection(recentGame)}
                    className="text-xs"
                  >
                    {recentGame}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="placedBy">Placed By</Label>
            <Input
              id="placedBy"
              value={placedBy}
              onChange={(e) => setPlacedBy(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Bet Amount</Label>
              <Input
                id="cost"
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="winAmount">Potential Win</Label>
              <Input
                id="winAmount"
                type="number"
                value={winAmount}
                onChange={(e) => setWinAmount(e.target.value)}
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Add Participants</Label>
            <div className="flex flex-wrap gap-2">
              {recentParticipants.map((participant) => (
                <Button
                  key={participant}
                  type="button"
                  variant={participants.some(p => p.name === participant) ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handleAddParticipant(participant)}
                  className="p-1"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-transparent text-primary">{getInitials(participant)}</AvatarFallback>
                  </Avatar>
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewParticipantInput(true)}
                className="p-1"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {showNewParticipantInput && (
              <div className="flex space-x-2 mt-2">
                <Input
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter participant name"
                />
                <Button type="button" onClick={() => {
                  handleAddParticipant(newParticipant)
                  setNewParticipant('')
                  setShowNewParticipantInput(false)
                }}>Add</Button>
              </div>
            )}
          </div>
          {participants.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Participants</Label>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-blue-500 hover:underline focus:outline-none"
                >
                  (advanced)
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {participants.map((participant, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-transparent text-primary">{getInitials(participant.name)}</AvatarFallback>
                      </Avatar>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 absolute -bottom-1 -right-1 bg-white rounded-full p-0"
                        onClick={() => handleRemoveParticipant(index)}
                      >
                        <Minus className="h-3 w-3 text-red-500" />
                        <span className="sr-only">Remove participant</span>
                      </Button>
                    </div>
                    <span className="flex-grow truncate">{participant.name}</span>
                    {showAdvanced && (
                      <Input
                        type="number"
                        value={participant.share.toString()}
                        onChange={(e) => handleParticipantShareChange(index, e.target.value)}
                        className="w-16 h-6 text-right text-xs px-1"
                        aria-label={`Share for ${participant.name}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {showParticipantAlert && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please add at least one participant before submitting the bet.
              </AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full">
            {isDuplicating ? 'Add Bet' : (initialBet ? 'Update Bet' : 'Add Bet')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}