import React from 'react';
import { type BlogPost } from './api';

interface TripPDFExportProps {
  posts: BlogPost[];
  onClose: () => void;
}

export function TripPDFExport({ posts, onClose }: TripPDFExportProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Screen-only controls */}
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm">
        <h2 className="text-slate-900">Trip Memory Book - Print Preview</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Print / Save as PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Print-friendly content */}
      <div className="max-w-4xl mx-auto p-8">
        {/* Cover Page */}
        <div className="mb-12 text-center break-after-page">
          <h1 className="text-5xl mb-4 text-slate-900 print:text-4xl">
            Dad's Journey
          </h1>
          <h2 className="text-2xl mb-6 text-slate-600 print:text-xl">
            January 21-23, 2026
          </h2>
          <p className="text-lg text-slate-500 mb-8">
            A three-day adventure from Davenport to Saint Meinrad Abbey
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
          <p className="text-sm text-slate-400 mt-12">
            Created on {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Posts */}
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="mb-12 break-after-page"
          >
            {/* Post Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Message #{posts.length - index}
                </span>
                <span className="text-sm text-slate-500">
                  {new Date(post.timestamp).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <h3 className="text-2xl text-slate-900 mb-1 print:text-xl">
                📍 {post.location}
              </h3>
              {post.nextEvent && (
                <p className="text-sm text-slate-500">
                  Next stop: {post.nextEvent}
                </p>
              )}
            </div>

            {/* Post Content */}
            <div className="prose prose-slate max-w-none mb-8">
              <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap print:text-base">
                {post.text}
              </p>
            </div>

            {/* Images - Each on its own page */}
            {post.imageUrls && post.imageUrls.length > 0 && (
              <div className="space-y-0">
                {post.imageUrls.map((imageUrl, imgIndex) => (
                  <div
                    key={imgIndex}
                    className={`flex flex-col items-center justify-center ${imgIndex < post.imageUrls!.length - 1 ? 'break-after-page' : ''}`}
                    style={{ minHeight: imgIndex > 0 ? '100vh' : 'auto' }}
                  >
                    <div className="max-w-full">
                      <img
                        src={imageUrl}
                        alt={`Photo ${imgIndex + 1} from ${post.location}`}
                        className="w-full h-auto max-h-[85vh] object-contain mx-auto"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23e2e8f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%2394a3b8"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <p className="text-sm text-slate-600 mt-4 text-center">
                        {post.location} - Photo {imgIndex + 1} of {post.imageUrls!.length}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
          <p>Total messages: {posts.length}</p>
          <p className="mt-2">
            This memory book was created from Dad's live trip tracker
          </p>
        </div>
      </div>
    </div>
  );
}