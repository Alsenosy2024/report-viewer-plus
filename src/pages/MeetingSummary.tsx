import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mic, Video, Square, Loader2, Calendar, FileText, RefreshCw, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface MeetingSummary {
  id: string;
  meeting_type: string;
  recording_url: string | null;
  summary_html: string | null;
  created_at: string;
  updated_at: string;
}

export default function MeetingSummary() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [meetingType, setMeetingType] = useState<'online' | 'offline'>('online');
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Fetch meetings on mount
  useEffect(() => {
    fetchMeetings();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('meeting-summaries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_summaries'
        },
        () => {
          fetchMeetings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meeting_summaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load meetings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendMeeting = async (meeting: MeetingSummary) => {
    if (!meeting.recording_url) {
      toast({
        title: 'Error',
        description: 'No recording URL available',
        variant: 'destructive',
      });
      return;
    }

    setResendingId(meeting.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: functionError } = await supabase.functions.invoke('process-meeting', {
        body: {
          meeting_id: meeting.id,
          recording_url: meeting.recording_url,
          meeting_type: meeting.meeting_type,
          user_id: user.id,
        },
      });

      if (functionError) {
        throw functionError;
      }

      toast({
        title: 'Success',
        description: 'Recording resent for processing',
      });
    } catch (error) {
      console.error('Error resending meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend recording',
        variant: 'destructive',
      });
    } finally {
      setResendingId(null);
    }
  };

  const handleDeleteMeeting = async (meeting: MeetingSummary) => {
    if (!confirm('Are you sure you want to delete this meeting recording?')) {
      return;
    }

    setDeletingId(meeting.id);

    try {
      // Delete the recording file from storage if it exists
      if (meeting.recording_url) {
        const urlParts = meeting.recording_url.split('/meeting-recordings/');
        if (urlParts.length === 2) {
          const filePath = urlParts[1];
          const { error: storageError } = await supabase.storage
            .from('meeting-recordings')
            .remove([filePath]);

          if (storageError) {
            console.error('Error deleting file from storage:', storageError);
          }
        }
      }

      // Delete the database record
      const { error: deleteError } = await supabase
        .from('meeting_summaries')
        .delete()
        .eq('id', meeting.id);

      if (deleteError) {
        throw deleteError;
      }

      toast({
        title: 'Success',
        description: 'Meeting record deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete meeting record',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const startRecording = async () => {
    try {
      let stream: MediaStream;
      let mimeType: string;

      if (meetingType === 'online') {
        // Get screen capture with system audio
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });

        // Get user microphone
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        // Create audio context to mix audio tracks
        const audioContext = new AudioContext();
        const audioDestination = audioContext.createMediaStreamDestination();

        // Add screen audio if available
        const screenAudioTracks = screenStream.getAudioTracks();
        if (screenAudioTracks.length > 0) {
          const screenAudioSource = audioContext.createMediaStreamSource(
            new MediaStream(screenAudioTracks)
          );
          screenAudioSource.connect(audioDestination);
        }

        // Add microphone audio
        const micAudioSource = audioContext.createMediaStreamSource(micStream);
        micAudioSource.connect(audioDestination);

        // Combine video and mixed audio
        const videoTrack = screenStream.getVideoTracks()[0];
        const mixedAudioTrack = audioDestination.stream.getAudioTracks()[0];
        
        stream = new MediaStream([videoTrack, mixedAudioTrack]);
        mimeType = 'video/webm;codecs=vp8,opus';
      } else {
        // Offline: only microphone with enhanced settings
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            channelCount: 2
          }
        });
        mimeType = 'audio/webm;codecs=opus';
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await handleRecordingStop(stream);
      };

      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: 'Recording Started',
        description: `${meetingType === 'online' ? 'Screen and audio' : 'Audio'} recording in progress`,
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Error',
        description: 'Failed to start recording. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRecordingStop = async (stream: MediaStream) => {
    // Stop all tracks
    stream.getTracks().forEach(track => track.stop());

    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create blob from chunks
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const fileName = `${user.id}/${Date.now()}_${meetingType}.webm`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meeting-recordings')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('meeting-recordings')
        .getPublicUrl(fileName);

      // Create meeting summary record
      const { data: summaryData, error: summaryError } = await supabase
        .from('meeting_summaries')
        .insert({
          user_id: user.id,
          meeting_type: meetingType,
          recording_url: urlData.publicUrl,
        })
        .select()
        .single();

      if (summaryError) throw summaryError;

      // Send to webhook via edge function
      const { error: functionError } = await supabase.functions.invoke('process-meeting', {
        body: {
          meeting_id: summaryData.id,
          recording_url: urlData.publicUrl,
          meeting_type: meetingType,
          user_id: user.id,
        },
      });

      if (functionError) {
        console.error('Error calling process-meeting function:', functionError);
      }

      toast({
        title: 'Success',
        description: 'Recording uploaded and sent for processing',
      });
    } catch (error) {
      console.error('Error processing recording:', error);
      toast({
        title: 'Error',
        description: 'Failed to process recording',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      chunksRef.current = [];
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Meeting Summary</h1>
        <p className="text-muted-foreground">Record and summarize your meetings</p>
      </div>

      <Tabs value={meetingType} onValueChange={(value) => setMeetingType(value as 'online' | 'offline')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="online" disabled={isRecording}>
            <Video className="w-4 h-4 mr-2" />
            Online Meeting
          </TabsTrigger>
          <TabsTrigger value="offline" disabled={isRecording}>
            <Mic className="w-4 h-4 mr-2" />
            Offline Meeting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="online" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Online Meeting Recording</CardTitle>
              <CardDescription>
                Record your screen and audio for online meetings
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              {!isRecording && !isProcessing && (
                <Button
                  size="lg"
                  onClick={startRecording}
                  className="w-full max-w-md h-16 text-lg"
                >
                  <Video className="w-6 h-6 mr-2" />
                  Start Recording
                </Button>
              )}

              {isRecording && (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopRecording}
                  className="w-full max-w-md h-16 text-lg"
                >
                  <Square className="w-6 h-6 mr-2" />
                  Stop Recording
                </Button>
              )}

              {isProcessing && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Processing recording...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Offline Meeting Recording</CardTitle>
              <CardDescription>
                Record audio only for offline meetings
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              {!isRecording && !isProcessing && (
                <Button
                  size="lg"
                  onClick={startRecording}
                  className="w-full max-w-md h-16 text-lg"
                >
                  <Mic className="w-6 h-6 mr-2" />
                  Start Recording
                </Button>
              )}

              {isRecording && (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopRecording}
                  className="w-full max-w-md h-16 text-lg"
                >
                  <Square className="w-6 h-6 mr-2" />
                  Stop Recording
                </Button>
              )}

              {isProcessing && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Processing recording...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recorded Meetings List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recorded Meetings</CardTitle>
          <CardDescription>View your meeting recordings and summaries</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : meetings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No meetings recorded yet
            </p>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <Card key={meeting.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          {meeting.meeting_type === 'online' ? (
                            <Video className="w-4 h-4 text-primary" />
                          ) : (
                            <Mic className="w-4 h-4 text-primary" />
                          )}
                          <span className="font-medium capitalize">
                            {meeting.meeting_type} Meeting
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(meeting.created_at), 'PPpp')}
                          </span>
                        </div>

                        {meeting.summary_html && (
                          <div className="mt-4 p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4" />
                              <span className="font-medium text-sm">Summary</span>
                            </div>
                            <div 
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: meeting.summary_html }}
                            />
                          </div>
                        )}

                        {!meeting.summary_html && (
                          <p className="text-sm text-muted-foreground italic">
                            Summary processing...
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendMeeting(meeting)}
                          disabled={resendingId === meeting.id || deletingId === meeting.id}
                        >
                          {resendingId === meeting.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                        {meeting.recording_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(meeting.recording_url!, '_blank')}
                            disabled={deletingId === meeting.id}
                          >
                            View Recording
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteMeeting(meeting)}
                          disabled={deletingId === meeting.id || resendingId === meeting.id}
                        >
                          {deletingId === meeting.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
