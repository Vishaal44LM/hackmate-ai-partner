import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Sparkles, Users } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Message {
  id: string;
  message: string;
  user_email: string;
  is_ai: boolean;
  created_at: string;
}

interface Suggestion {
  id: string;
  suggestion: string;
  suggestion_type: string;
  created_at: string;
}

interface Participant {
  user_id: string;
  user_email?: string;
}

const IdeationRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [room, setRoom] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && roomId) {
      fetchRoomData();
      setupRealtimeSubscriptions();
    }
  }, [user, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    } else {
      setUser(user);
    }
  };

  const fetchRoomData = async () => {
    try {
      const [roomRes, messagesRes, suggestionsRes, participantsRes] = await Promise.all([
        supabase.from('rooms').select('*').eq('id', roomId).single(),
        supabase.from('room_messages').select('*').eq('room_id', roomId).order('created_at'),
        supabase.from('room_ai_suggestions').select('*').eq('room_id', roomId).order('created_at', { ascending: false }).limit(5),
        supabase.from('room_participants').select('user_id').eq('room_id', roomId),
      ]);

      if (roomRes.error) throw roomRes.error;
      
      setRoom(roomRes.data);
      setMessages(messagesRes.data || []);
      setSuggestions(suggestionsRes.data || []);
      setParticipants(participantsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load room",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const messagesChannel = supabase
      .channel(`room-messages-${roomId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'room_messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    const suggestionsChannel = supabase
      .channel(`room-suggestions-${roomId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'room_ai_suggestions',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        setSuggestions(prev => [payload.new as Suggestion, ...prev].slice(0, 5));
      })
      .subscribe();

    const participantsChannel = supabase
      .channel(`room-participants-${roomId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_participants',
        filter: `room_id=eq.${roomId}`
      }, () => {
        fetchParticipants();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(suggestionsChannel);
      supabase.removeChannel(participantsChannel);
    };
  };

  const fetchParticipants = async () => {
    const { data } = await supabase
      .from('room_participants')
      .select('user_id')
      .eq('room_id', roomId);
    
    if (data) setParticipants(data);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase.from('room_messages').insert([{
        room_id: roomId,
        user_id: user.id,
        user_email: user.email,
        message: newMessage,
        is_ai: false,
      }]);

      if (error) throw error;

      setNewMessage("");
      
      // Trigger AI moderation
      if (messages.length % 3 === 0) {
        await supabase.functions.invoke('ai-room-moderator', {
          body: { roomId, recentMessages: messages.slice(-5).map(m => m.message) }
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="outline" onClick={() => navigate("/ideation-rooms")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Rooms
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chat Area */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{room?.name}</span>
              <Badge variant="outline">{room?.theme}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] overflow-y-auto mb-4 space-y-3 p-4 bg-muted/20 rounded-lg">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.is_ai ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[70%] rounded-lg p-3 ${
                    msg.is_ai 
                      ? 'bg-primary/10 text-primary' 
                      : msg.user_email === user?.email 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {msg.is_ai && <Sparkles className="w-4 h-4 inline mr-1" />}
                    <span className="text-xs font-semibold block mb-1">
                      {msg.is_ai ? "AI Assistant" : msg.user_email}
                    </span>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button type="submit" variant="gradient">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Participants ({participants.length}/{room?.max_participants})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {participants.map((p, i) => (
                  <div key={p.user_id} className="text-sm p-2 bg-muted/50 rounded">
                    Participant {i + 1}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No suggestions yet. Keep the conversation going!
                  </p>
                ) : (
                  suggestions.map((s) => (
                    <div key={s.id} className="p-3 bg-primary/10 rounded-lg">
                      <Badge className="mb-2">{s.suggestion_type}</Badge>
                      <p className="text-sm">{s.suggestion}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IdeationRoom;
