import { useRoom } from '../context/RoomContext';
import { Badge } from '@/components/ui/badge';

interface SyncStatusProps {
  isSynced: boolean;
}

export function SyncStatus({ isSynced }: SyncStatusProps) {
  const { isHost } = useRoom();

  if (isHost) {
    return (
      <Badge variant="warning">
        Host
      </Badge>
    );
  }

  return (
    <Badge variant={isSynced ? "success" : "secondary"}>
      <span
        className={`w-2 h-2 rounded-full mr-1.5 ${
          isSynced ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
        }`}
      />
      {isSynced ? 'Sincronizado' : 'Sincronizando...'}
    </Badge>
  );
}
