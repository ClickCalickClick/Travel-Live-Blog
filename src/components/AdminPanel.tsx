import React, { useState } from 'react';
import { MapPin, Camera, Send, Loader2, TestTube, Calendar as CalendarIcon, Eye, Trash2, FileText, AlertTriangle, Lock } from 'lucide-react';
import { updateLocation, createBlogPost, updateTripStop, getBlogPosts, type BlogPost } from './api';
import { allStops, tripStops } from './trip-data';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { prepareImageForUpload } from '../utils/imageCompression';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { TripPDFExport } from './TripPDFExport';

interface AdminPanelProps {
  onLogout?: () => void;
}

export function AdminPanel({ onLogout }: AdminPanelProps) {
  const [selectedStop, setSelectedStop] = useState('');
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isPostingUpdate, setIsPostingUpdate] = useState(false);
  
  // Test mode states
  const [testDate, setTestDate] = useState('');
  const [testTime, setTestTime] = useState('');
  const [simulatedStop, setSimulatedStop] = useState<typeof allStops[0] | null>(null);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [showPosts, setShowPosts] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [showPDFExport, setShowPDFExport] = useState(false);
  const [pdfExportPosts, setPdfExportPosts] = useState<BlogPost[]>([]);

  const handleUpdateLocation = async () => {
    if (!selectedStop) {
      toast.error('Please select a location');
      return;
    }

    const stop = allStops.find(s => s.name === selectedStop);
    if (!stop) return;

    setIsUpdatingLocation(true);
    try {
      await updateLocation(stop.lat, stop.lng, stop.label);
      const stopIndex = allStops.indexOf(stop);
      await updateTripStop(stopIndex, stop.name);
      toast.success(`Location updated to ${stop.label}`);
    } catch (error) {
      toast.error('Failed to update location');
      console.error(error);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handlePostUpdate = async () => {
    if (!postText.trim()) {
      toast.error('Please enter some text');
      return;
    }

    if (!selectedStop) {
      toast.error('Please select your current location');
      return;
    }

    const stop = allStops.find(s => s.name === selectedStop);
    if (!stop) return;

    // Find the next event
    const currentIndex = allStops.indexOf(stop);
    const nextStop = currentIndex < allStops.length - 1 ? allStops[currentIndex + 1] : null;
    const nextEvent = nextStop ? nextStop.name : 'End of journey!';

    setIsPostingUpdate(true);
    try {
      // Create FormData with additional fields
      const formData = new FormData();
      formData.append('text', postText);
      formData.append('location', stop.label);
      formData.append('lat', stop.lat.toString());
      formData.append('lng', stop.lng.toString());
      formData.append('nextEvent', nextEvent);
      
      if (postImage) {
        setIsCompressing(true);
        toast.info('Compressing image...');
        const compressedImage = await prepareImageForUpload(postImage);
        formData.append('image', compressedImage);
        setIsCompressing(false);
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cf1072ab/blog`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to post update');
      }

      toast.success('Update posted successfully!');
      setPostText('');
      setPostImage(null);
      // Reset file input
      const fileInput = document.getElementById('imageInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Refresh posts list if visible
      if (showPosts) loadPosts();
    } catch (error) {
      toast.error('Failed to post update');
      console.error(error);
    } finally {
      setIsPostingUpdate(false);
    }
  };

  const simulateTripDate = () => {
    if (!testDate || !testTime) {
      toast.error('Please select both date and time');
      return;
    }

    const selectedDateTime = new Date(`${testDate}T${testTime}`);
    
    // Find which stop you'd be at based on the date/time
    let foundStop = null;
    for (const stop of allStops) {
      const stopDateTime = parseStopDateTime(stop.time);
      if (stopDateTime && selectedDateTime >= stopDateTime) {
        foundStop = stop;
      } else {
        break;
      }
    }

    if (foundStop) {
      setSimulatedStop(foundStop);
      toast.success(`At ${testDate} ${testTime}, you would be at: ${foundStop.name}`);
    } else {
      setSimulatedStop(null);
      toast.info('Trip has not started yet at this date/time');
    }
  };

  const parseStopDateTime = (timeStr: string) => {
    // Parse times like "8:00 AM CT" or "1:45 PM ET"
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const isPM = match[3].toUpperCase() === 'PM';
    
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;

    // Find which day this stop is on
    for (const day of tripStops) {
      if (day.stops.some(s => s.time === timeStr)) {
        const dayMatch = day.day.match(/Jan (\d+)/);
        if (dayMatch) {
          const dayNum = parseInt(dayMatch[1]);
          return new Date(2026, 0, dayNum, hours, minutes);
        }
      }
    }
    return null;
  };

  const loadPosts = async () => {
    const posts = await getBlogPosts();
    setAllPosts(posts);
    setShowPosts(true);
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      // Note: We'd need to add a delete endpoint to the backend
      // For now, just show a message
      toast.info('Delete functionality requires backend endpoint');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const wipeAllPosts = async () => {
    setIsWiping(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cf1072ab/blog/wipe`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to wipe posts');
      }

      toast.success(`Successfully deleted ${data.deletedPosts} posts!`);
      setShowWipeModal(false);
      
      // Refresh posts list if visible
      if (showPosts) {
        setAllPosts([]);
      }
    } catch (error) {
      toast.error('Failed to wipe posts');
      console.error(error);
    } finally {
      setIsWiping(false);
    }
  };

  const exportToPDF = async () => {
    // Load posts if not already loaded
    let postsToExport = allPosts;
    if (!showPosts || allPosts.length === 0) {
      toast.info('Loading posts...');
      postsToExport = await getBlogPosts();
    }

    if (postsToExport.length === 0) {
      toast.error('No posts to export');
      return;
    }

    // Show PDF export view
    setPdfExportPosts(postsToExport);
    setShowPDFExport(true);
  };

  // If showing PDF export, render that instead
  if (showPDFExport) {
    return (
      <TripPDFExport 
        posts={pdfExportPosts}
        onClose={() => setShowPDFExport(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white p-8">
          <h1 className="mb-2">Trip Admin Panel</h1>
          <p className="text-blue-100">Test, preview, and manage your journey</p>
        </div>

        {/* Update Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Update Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="location">Select Current Location</Label>
              <select
                id="location"
                value={selectedStop}
                onChange={(e) => setSelectedStop(e.target.value)}
                className="w-full mt-2 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a stop...</option>
                {allStops.map((stop, idx) => (
                  <option key={idx} value={stop.name}>
                    {stop.name} - {stop.time} ({stop.label})
                  </option>
                ))}
              </select>
            </div>
            <Button 
              onClick={handleUpdateLocation}
              disabled={isUpdatingLocation || !selectedStop}
              className="w-full"
            >
              {isUpdatingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Update Location
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Post Update */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Post Update
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="updateText">Update Text</Label>
              <Textarea
                id="updateText"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Share what's happening on your journey..."
                rows={4}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="imageInput">Add Photo (optional)</Label>
              <Input
                id="imageInput"
                type="file"
                accept="image/*"
                onChange={(e) => setPostImage(e.target.files?.[0] || null)}
                className="mt-2"
              />
              {postImage && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-slate-600">
                    Selected: {postImage.name}
                  </p>
                  <p className="text-xs text-green-600">
                    📦 Images are automatically compressed to save storage space
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                Your post will be tagged with: <strong>{selectedStop ? allStops.find(s => s.name === selectedStop)?.label : 'No location selected'}</strong>
              </p>
            </div>

            <Button 
              onClick={handlePostUpdate}
              disabled={isPostingUpdate || !postText.trim() || !selectedStop}
              className="w-full"
            >
              {isPostingUpdate ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Post Update
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-sm mb-2 text-green-900">How to use during your trip:</h3>
          <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
            <li>Select your current location from the dropdown</li>
            <li>Click "Update Location" to update the map on all designs</li>
            <li>Write a message about what you're doing or seeing</li>
            <li>Optionally add a photo from your phone</li>
            <li>Click "Post Update" to share it on the live blog feed</li>
          </ol>
        </div>

        {/* Test Mode */}
        <Card className="border-2 border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5 text-purple-600" />
              Trip Date Simulator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-700 mb-4">
              Test what the app will show during your actual trip dates. Pick a date and time to see where you'll be in your itinerary.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="testDate">Select Date</Label>
                <Input
                  id="testDate"
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  min="2026-01-21"
                  max="2026-01-23"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="testTime">Select Time</Label>
                <Input
                  id="testTime"
                  type="time"
                  value={testTime}
                  onChange={(e) => setTestTime(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <Button 
              onClick={simulateTripDate}
              disabled={!testDate || !testTime}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Simulate This Date/Time
            </Button>
            
            {simulatedStop && (
              <div className="mt-4 p-4 bg-white rounded-lg border-2 border-purple-300">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <Badge className="bg-purple-600 text-white mb-2">
                      {testDate} at {testTime}
                    </Badge>
                    <h4 className="text-slate-900 mb-1">{simulatedStop.name}</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      📍 {simulatedStop.label}
                    </p>
                    <p className="text-sm text-slate-600">
                      ⏰ Scheduled for {simulatedStop.time}
                    </p>
                    
                    {/* Show next event */}
                    {(() => {
                      const currentIndex = allStops.indexOf(simulatedStop);
                      const nextStop = currentIndex < allStops.length - 1 ? allStops[currentIndex + 1] : null;
                      return nextStop ? (
                        <div className="mt-3 pt-3 border-t border-purple-200">
                          <p className="text-xs text-purple-600 mb-1">NEXT UP:</p>
                          <p className="text-sm text-slate-700">
                            {nextStop.name} at {nextStop.time}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 pt-3 border-t border-purple-200">
                          <p className="text-sm text-green-700">🎉 End of journey!</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View All Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              View All Posts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showPosts ? (
              <Button 
                onClick={loadPosts}
                variant="outline"
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Load All Posts
              </Button>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    {allPosts.length} {allPosts.length === 1 ? 'post' : 'posts'} found
                  </p>
                  <Button 
                    onClick={() => setShowPosts(false)}
                    variant="ghost"
                    size="sm"
                  >
                    Hide
                  </Button>
                </div>
                
                {allPosts.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {allPosts.map(post => (
                      <div key={post.id} className="bg-slate-100 rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary">{post.location}</Badge>
                              <span className="text-xs text-slate-500">
                                {new Date(post.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-slate-800">{post.text}</p>
                            {post.nextEvent && (
                              <p className="text-xs text-slate-600 mt-1">
                                Next: {post.nextEvent}
                              </p>
                            )}
                            {post.imageUrl && (
                              <div className="mt-2">
                                <img 
                                  src={post.imageUrl} 
                                  alt="Post" 
                                  className="w-32 h-32 object-cover rounded-lg"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-8">
                    No posts yet. Create your first post above!
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Wipe All Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Wipe All Posts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-700 mb-4">
              This will delete all posts from the blog. This action cannot be undone.
            </p>
            <Button 
              onClick={() => setShowWipeModal(true)}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Wipe All Posts
            </Button>
            
            {showWipeModal && (
              <div className="mt-4 p-4 bg-white rounded-lg border-2 border-red-300">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <Badge className="bg-red-600 text-white mb-2">
                      Confirm Wipe
                    </Badge>
                    <h4 className="text-slate-900 mb-1">Are you sure?</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      This will permanently delete all posts from the blog.
                    </p>
                    <p className="text-sm text-slate-600">
                      This action cannot be undone.
                    </p>
                    
                    {/* Show next event */}
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-xs text-red-600 mb-1">NEXT STEPS:</p>
                      <p className="text-sm text-slate-700">
                        <Button 
                          onClick={wipeAllPosts}
                          disabled={isWiping}
                          className="w-full bg-red-600 hover:bg-red-700"
                        >
                          {isWiping ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Wiping...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Confirm Wipe
                            </>
                          )}
                        </Button>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export to PDF */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Export to PDF
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-700 mb-4">
              Export all posts to a PDF file for offline viewing.
            </p>
            <Button 
              onClick={exportToPDF}
              variant="outline"
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export to PDF
            </Button>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Logout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-700 mb-4">
              Logout from the admin panel.
            </p>
            <Button 
              onClick={onLogout}
              variant="destructive"
              className="w-full"
            >
              <Lock className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}