import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Heart, Settings, Maximize, Minimize } from 'lucide-react';
import { getBlogPosts, type BlogPost } from '../api';
import { Button } from '../ui/button';
import { KidMessageModal } from '../KidMessageModal';
import homeImage from '../../assets/home.jpg';

interface Design5StoryProps {
  onAdminClick?: () => void;
  hasNewKidMessages?: boolean;
  showAdminButton?: boolean;
}

export function Design5Story({ onAdminClick, hasNewKidMessages, showAdminButton = true }: Design5StoryProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [touchStartDistance, setTouchStartDistance] = useState(0);
  const [touchStartScale, setTouchStartScale] = useState(1);
  const [showAlreadyLatest, setShowAlreadyLatest] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const postsRef = useRef<BlogPost[]>([]);
  const popupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showKidModal, setShowKidModal] = useState(false);

  // ... (cuteMessages array remains unchanged) ...
  const cuteMessages = [
    {
      emoji: '💝',
      title: 'Already the newest post, sweet girls!',
      subtitle: 'Dad will post again soon! 🚗✨'
    },
    {
      emoji: '🌟',
      title: "You're all caught up, my loves!",
      subtitle: "Dad's thinking of you! Keep checking back! 💕"
    },
    {
      emoji: '🎀',
      title: 'No new adventures yet, sweethearts!',
      subtitle: "Dad will share more soon! Miss you! 💖"
    },
    {
      emoji: '🦋',
      title: "That's the latest, beautiful girls!",
      subtitle: "More updates coming as Dad travels! 🌈✨"
    },
    {
      emoji: '💐',
      title: "You're up to date, precious ones!",
      subtitle: "Dad loves you and will post more soon! 🚙💗"
    },
    {
      emoji: '🌸',
      title: "All caught up, my darlings!",
      subtitle: "Dad's next update is on the way! Stay tuned! 💝"
    }
  ];
  const [currentMessage, setCurrentMessage] = useState(cuteMessages[0]);

  useEffect(() => {
    loadData(false); // Initial load: show latest
    const interval = setInterval(() => loadData(true), 10000); // Background refresh: keep position
    return () => clearInterval(interval);
  }, []);

  async function loadData(keepPosition = false) {
    const blogPosts = await getBlogPosts();
    setPosts(blogPosts);
    postsRef.current = blogPosts;

    // Only reset to latest if we're not keeping position
    if (!keepPosition) {
      setCurrentIndex(0);
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'Escape') setSelectedImageIndex(null);
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, posts.length]);

  const goNext = () => {
    if (currentIndex < posts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFailedImages(new Set());
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFailedImages(new Set());
    }
  };

  const goToNow = () => {
    setCurrentIndex(0);
    setFailedImages(new Set());
  };

  const handleLatestRefresh = async () => {
    if (currentIndex === 0) {
      // Already on latest - refresh data and check for new posts
      const currentLatestId = postsRef.current[0]?.id;
      await loadData();

      // Check if we got new posts by comparing IDs
      // Use a timeout to ensure state has updated
      setTimeout(() => {
        const newLatestId = postsRef.current[0]?.id;
        if (currentLatestId === newLatestId) {
          // Pick a random cute message
          const randomMessage = cuteMessages[Math.floor(Math.random() * cuteMessages.length)];
          setCurrentMessage(randomMessage);
          setShowAlreadyLatest(true);
          // Clear any existing timer
          if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
          // Set a new timer to hide the popup after 6 seconds
          popupTimerRef.current = setTimeout(() => setShowAlreadyLatest(false), 6000);
        }
      }, 100);
    } else {
      // On older post - jump to latest
      setCurrentIndex(0);
      setFailedImages(new Set());
    }
  }; // END handleLatestRefresh

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentPost = posts[currentIndex];
  // Scroll to top when post changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentPost?.id]);

  // Reset zoom when image changes
  useEffect(() => {
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  }, [selectedImageIndex]);

  const images = currentPost?.imageUrls || (currentPost?.imageUrl ? [currentPost.imageUrl] : []);

  // Format time in a kid-friendly way
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  // Empty state - no posts yet
  if (posts.length === 0) {
    return (
      <div className="h-[100dvh] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6 relative">
        {showAdminButton && (
          <button
            onClick={onAdminClick}
            className="absolute top-4 right-4 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Settings className="w-4 h-4" />
            <span>Admin</span>
          </button>
        )}
        <div className="text-center max-w-md">
          <div className="text-8xl mb-6 animate-bounce">🚗</div>
          <h1 className="mb-4 text-slate-800 font-bold text-3xl">Dad's Adventure Starts Soon!</h1>
          <p className="text-slate-600 text-xl leading-relaxed">
            Updates and photos will appear here when the journey begins on January 21st
          </p>
          <p className="mt-8 text-slate-400 text-sm">
            Check back later for live updates from the road
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col overflow-hidden">
      {/* Top Section: Compact Header - Single line in landscape, stacked in portrait */}
      <div className="bg-white shadow-md flex-shrink-0">
        <div className="px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            {/* Location, Time, Next Event - Single line on landscape */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-2xl sm:text-3xl flex-shrink-0">📍</span>
                <span className="text-slate-800 truncate">
                  {currentPost?.type === 'kid_post'
                    ? 'Message from home'
                    : (currentPost?.location || 'On the road')}
                </span>
              </div>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-slate-600 whitespace-nowrap">
                {formatTime(currentPost?.timestamp || '')}
              </span>
              {currentPost?.nextEvent && (
                <>
                  <span className="text-slate-400 hidden sm:inline">•</span>
                  <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap">
                    <span className="text-sm">→</span>
                    <span className="text-xs sm:text-sm">Next: {currentPost.nextEvent}</span>
                  </div>
                </>
              )}
            </div>
            {/* Right side buttons - NOW button and Admin button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {currentIndex > 0 && (
                <Button
                  onClick={goToNow}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 h-8"
                >
                  <span className="text-base mr-1">🔴</span>
                  <span className="text-sm">NOW</span>
                </Button>
              )}

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="bg-white text-slate-700 border border-slate-200 px-3 py-1 h-8 rounded-full shadow-sm flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
              </button>

              {showAdminButton && (
                <button
                  onClick={onAdminClick}
                  className="relative bg-gradient-to-br from-slate-700 to-slate-900 text-white px-3 py-1 h-8 rounded-full shadow-lg flex items-center gap-1.5 hover:scale-105 transition-transform"
                  aria-label="Admin panel"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="text-xs sm:text-sm">Admin</span>
                  {/* Green notification badge for new kid messages */}
                  {hasNewKidMessages && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Map/Message/Images - FILLS ENTIRE SPACE */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-4 sm:p-6 overflow-y-auto"
      >
        <div className="w-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col">
          {/* Map */}
          <div className="relative h-32 sm:h-48 bg-slate-100 flex-shrink-0 rounded-t-2xl sm:rounded-t-3xl overflow-hidden">
            {currentPost?.type === 'kid_post' ? (
              <img
                src={homeImage}
                alt="Dad's Home"
                className="w-full h-full object-cover"
              />
            ) : currentPost?.lat && currentPost?.lng ? (
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentPost.lng - 0.1},${currentPost.lat - 0.1},${currentPost.lng + 0.1},${currentPost.lat + 0.1}&layer=mapnik&marker=${currentPost.lat},${currentPost.lng}`}
                className="w-full h-full border-0"
                title="Location map"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">
                🗺️
              </div>
            )}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg">
              <span className="text-xs sm:text-sm">
                Message {posts.length - currentIndex} of {posts.length}
              </span>
            </div>
          </div>

          {/* Dad's message */}
          {currentPost?.text && (
            <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-yellow-50 to-orange-50 flex-shrink-0">
              <p className="text-lg sm:text-xl md:text-2xl text-slate-800 leading-relaxed">
                {currentPost.text}
              </p>
            </div>
          )}

          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="p-4 sm:p-6 bg-white flex-shrink-0">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-200 hover:ring-4 hover:ring-blue-400 transition-all transform hover:scale-105"
                  >
                    {!failedImages.has(idx) ? (
                      <img
                        src={imgUrl}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={() => {
                          setFailedImages(prev => {
                            const newSet = new Set(prev);
                            newSet.add(idx);
                            return newSet;
                          });
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl">
                        📷
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {images.length > 1 && (
                <p className="text-center text-xs sm:text-sm text-slate-500 mt-3">
                  Tap a photo to see it bigger • {images.length} {images.length === 1 ? 'photo' : 'photos'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Navigation - ALWAYS VISIBLE */}
      <div className="bg-white shadow-lg flex-shrink-0 safe-bottom">
        <div className="px-2 py-2 sm:px-4 sm:py-2">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <Button
              onClick={goNext}
              disabled={currentIndex === posts.length - 1}
              size="lg"
              className="flex-1 h-10 sm:h-12 text-sm sm:text-lg disabled:opacity-30 min-w-0"
              variant="outline"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 mr-1 flex-shrink-0" />
              <span className="truncate">Older</span>
            </Button>

            <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
              {posts.slice(0, 6).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setFailedImages(new Set());
                  }}
                  className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all ${idx === currentIndex
                    ? 'bg-blue-600 w-4 sm:w-6'
                    : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                  aria-label={`Go to stop ${idx + 1}`}
                />
              ))}
              {posts.length > 6 && (
                <span className="text-slate-400 text-[10px] sm:text-xs flex items-center">
                  +{posts.length - 6}
                </span>
              )}
            </div>

            <Button
              onClick={handleLatestRefresh}
              disabled={false}
              size="lg"
              className="flex-1 h-10 sm:h-12 text-sm sm:text-lg min-w-0"
              variant="outline"
            >
              <span className="truncate">{currentIndex === 0 ? 'Refresh' : 'Latest'}</span>
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 ml-1 flex-shrink-0" />
            </Button>
          </div>
        </div>
      </div>

      {/* Full-screen image viewer */}
      {selectedImageIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6"
          onClick={() => setSelectedImageIndex(null)}
        >
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-6 right-6 w-16 h-16 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="max-w-6xl max-h-full">
            <img
              src={images[selectedImageIndex]}
              alt={`Full size photo ${selectedImageIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              style={{
                transform: `scale(${imageScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                transformOrigin: 'center',
              }}
              onWheel={(e) => {
                e.stopPropagation();
                const newScale = imageScale + e.deltaY * -0.01;
                setImageScale(Math.max(1, Math.min(5, newScale)));
              }}
              onTouchStart={(e) => {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                if (touch1 && touch2) {
                  const distance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                  );
                  setTouchStartDistance(distance);
                  setTouchStartScale(imageScale);
                }
              }}
              onTouchMove={(e) => {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                if (touch1 && touch2) {
                  const distance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                  );
                  const scale = touchStartScale * (distance / touchStartDistance);
                  setImageScale(Math.max(1, Math.min(5, scale)));
                } else {
                  const dx = e.touches[0].clientX - e.targetTouches[0].clientX;
                  const dy = e.touches[0].clientY - e.targetTouches[0].clientY;
                  setImagePosition({
                    x: imagePosition.x + dx,
                    y: imagePosition.y + dy,
                  });
                }
              }}
              onTouchEnd={() => {
                setImagePosition({ x: 0, y: 0 });
              }}
            />
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(Math.max(0, selectedImageIndex - 1));
                }}
                disabled={selectedImageIndex === 0}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1));
                }}
                disabled={selectedImageIndex === images.length - 1}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full">
                {selectedImageIndex + 1} of {images.length}
              </div>
            </>
          )}
        </div>
      )}

      {/* Cute "Already Latest" Animation Popup */}
      {showAlreadyLatest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-bounce-in bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white rounded-3xl shadow-2xl px-8 py-6 max-w-md mx-4 text-center transform">
            <div className="text-6xl mb-4 animate-wave">{currentMessage.emoji}</div>
            <p className="text-2xl sm:text-3xl mb-2">
              {currentMessage.title}
            </p>
            <p className="text-lg sm:text-xl opacity-90">
              {currentMessage.subtitle}
            </p>
          </div>
        </div>
      )}

      {/* Kid Message Modal */}
      {showKidModal && (
        <KidMessageModal
          onClose={() => setShowKidModal(false)}
          onMessageSent={() => {
            loadData();  // Refresh posts to show the kid's message
          }}
        />
      )}

      {/* Floating Action Button - Send Dad a Message */}
      <button
        onClick={() => setShowKidModal(true)}
        className="fixed bottom-16 right-4 sm:bottom-20 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-white border-4 border-pink-500 text-pink-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:bg-pink-50 transition-transform z-40"
        aria-label="Send Dad a message"
      >
        <Heart className="w-7 h-7 sm:w-9 sm:h-9" fill="currentColor" />
      </button>
    </div>
  );
}