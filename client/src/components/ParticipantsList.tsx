import { useRoom } from '../context/RoomContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

export function ParticipantsList() {
  const { participants } = useRoom();

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          Participantes ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2">
          {participants.map((participant) => (
            <li
              key={participant.id}
              className="flex items-center gap-3"
            >
              <span className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {participant.username.charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 text-sm truncate">{participant.username}</span>
              {participant.isHost && (
                <Badge variant="warning" className="shrink-0">
                  Host
                </Badge>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
