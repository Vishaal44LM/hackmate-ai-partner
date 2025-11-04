import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Users, Plus, LogOut } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Room {
  id: string;
  name: string;
  theme: string;
  description: string;
  created_at: string;
  max_participants: number;
  participant_count?: number;
}

const IdeationRooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", theme: "", description: "" });
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    fetchRooms();
    
    const channel = supabase
      .channel('rooms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    } else {
      setUser(user);
    }
  };

  const fetchRooms = async () => {
    try {
      const { data: roomsData, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch participant counts for each room
      const roomsWithCounts = await Promise.all(
        (roomsData || []).map(async (room) => {
          const { count } = await supabase
            .from('room_participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);
          
          return { ...room, participant_count: count || 0 };
        })
      );

      setRooms(roomsWithCounts);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert([{
          name: newRoom.name,
          theme: newRoom.theme,
          description: newRoom.description,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Automatically join the room as creator
      await supabase.from('room_participants').insert([{
        room_id: data.id,
        user_id: user.id,
      }]);

      toast({
        title: "Room created!",
        description: "Your ideation room is ready.",
      });
      
      setCreateDialogOpen(false);
      setNewRoom({ name: "", theme: "", description: "" });
      navigate(`/ideation-rooms/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const joinRoom = async (roomId: string, participantCount: number, maxParticipants: number) => {
    if (!user) return;

    if (participantCount >= maxParticipants) {
      toast({
        title: "Room full",
        description: "This room has reached maximum capacity.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('room_participants')
        .insert([{ room_id: roomId, user_id: user.id }]);

      if (error) {
        if (error.code === '23505') {
          // User already in room
          navigate(`/ideation-rooms/${roomId}`);
          return;
        }
        throw error;
      }

      navigate(`/ideation-rooms/${roomId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Ideation Rooms</h1>
          <p className="text-muted-foreground">Join or create collaborative brainstorming rooms</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="w-4 h-4 mr-2" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Ideation Room</DialogTitle>
                <DialogDescription>
                  Set up a collaborative space for up to 5 people
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Room name"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                />
                <Input
                  placeholder="Theme/Topic"
                  value={newRoom.theme}
                  onChange={(e) => setNewRoom({ ...newRoom, theme: e.target.value })}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                />
                <Button
                  onClick={createRoom}
                  className="w-full"
                  variant="gradient"
                  disabled={!newRoom.name || !newRoom.theme}
                >
                  Create Room
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {rooms.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">No rooms available yet</p>
            <Button variant="gradient" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {room.name}
                  <span className="text-sm font-normal flex items-center text-muted-foreground">
                    <Users className="w-4 h-4 mr-1" />
                    {room.participant_count}/{room.max_participants}
                  </span>
                </CardTitle>
                <CardDescription>{room.theme}</CardDescription>
              </CardHeader>
              <CardContent>
                {room.description && (
                  <p className="text-sm text-muted-foreground mb-4">{room.description}</p>
                )}
                <Button
                  onClick={() => joinRoom(room.id, room.participant_count || 0, room.max_participants)}
                  className="w-full"
                  variant={room.participant_count >= room.max_participants ? "outline" : "gradient"}
                  disabled={room.participant_count >= room.max_participants}
                >
                  {room.participant_count >= room.max_participants ? "Room Full" : "Join Room"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default IdeationRooms;
