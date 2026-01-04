import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const app = new Hono();

// Initialize Supabase client for storage
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Create storage bucket on startup
const bucketName = 'make-cf1072ab-trip-images';
const { data: buckets } = await supabase.storage.listBuckets();
const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
if (!bucketExists) {
  await supabase.storage.createBucket(bucketName, { public: false });
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-cf1072ab/health", (c) => {
  return c.json({ status: "ok" });
});

// Update current location
app.post("/make-server-cf1072ab/location", async (c) => {
  try {
    const { lat, lng, label } = await c.req.json();
    const locationData = {
      lat,
      lng,
      label,
      timestamp: new Date().toISOString(),
    };
    await kv.set("location:current", locationData);
    return c.json({ success: true, location: locationData });
  } catch (error) {
    console.error("Error updating location:", error);
    return c.json({ error: "Failed to update location: " + error.message }, 500);
  }
});

// Get current location
app.get("/make-server-cf1072ab/location", async (c) => {
  try {
    const location = await kv.get("location:current");
    return c.json({ location: location || null });
  } catch (error) {
    console.error("Error getting location:", error);
    return c.json({ error: "Failed to get location: " + error.message }, 500);
  }
});

// Upload image and create blog post
app.post("/make-server-cf1072ab/blog", async (c) => {
  try {
    const formData = await c.req.formData();
    const text = formData.get("text") as string;
    const image = formData.get("image") as File | null;
    const location = formData.get("location") as string;
    const lat = formData.get("lat") as string;
    const lng = formData.get("lng") as string;
    const nextEvent = formData.get("nextEvent") as string;

    // Check if there's already a post for this location
    const existingPosts = await kv.getByPrefix("blog:");
    const existingPost = existingPosts.find(post => post.location === location);

    let imageUrl = null;

    // Upload image to Supabase Storage if provided
    if (image) {
      const fileName = `${Date.now()}_${image.name}`;
      const arrayBuffer = await image.arrayBuffer();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, arrayBuffer, {
          contentType: image.type,
        });

      if (uploadError) {
        throw new Error("Image upload error: " + uploadError.message);
      }

      // Create signed URL
      const { data: signedUrlData } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

      imageUrl = signedUrlData?.signedUrl || null;
    }

    if (existingPost) {
      // Update existing post: add image, update text and timestamp
      const updatedPost = {
        ...existingPost,
        text: text || existingPost.text, // Update text if provided, otherwise keep existing
        imageUrls: imageUrl 
          ? [...(existingPost.imageUrls || []), imageUrl]
          : existingPost.imageUrls,
        imageUrl: existingPost.imageUrls?.[0] || imageUrl, // Keep first image as main imageUrl
        lat: lat ? parseFloat(lat) : existingPost.lat,
        lng: lng ? parseFloat(lng) : existingPost.lng,
        nextEvent: nextEvent || existingPost.nextEvent,
        timestamp: new Date().toISOString(), // Update to current time
      };

      await kv.set(`blog:${existingPost.id}`, updatedPost);

      return c.json({ success: true, post: updatedPost, updated: true });
    } else {
      // Create new post
      const postId = `post_${Date.now()}`;
      const blogPost = {
        id: postId,
        text,
        imageUrl,
        imageUrls: imageUrl ? [imageUrl] : [],
        location,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
        nextEvent: nextEvent || undefined,
        timestamp: new Date().toISOString(),
      };

      await kv.set(`blog:${postId}`, blogPost);

      return c.json({ success: true, post: blogPost, updated: false });
    }
  } catch (error) {
    console.error("Error creating blog post:", error);
    return c.json({ error: "Failed to create blog post: " + error.message }, 500);
  }
});

// Get all blog posts
app.get("/make-server-cf1072ab/blog", async (c) => {
  try {
    const posts = await kv.getByPrefix("blog:");
    // Sort by timestamp descending (newest first)
    const sortedPosts = posts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return c.json({ posts: sortedPosts });
  } catch (error) {
    console.error("Error getting blog posts:", error);
    return c.json({ error: "Failed to get blog posts: " + error.message }, 500);
  }
});

// Create kid post (drawing, photo, or text message)
app.post("/make-server-cf1072ab/kid-post", async (c) => {
  try {
    const formData = await c.req.formData();
    const type = formData.get("type") as string; // Should be "kid_post"
    const contentType = formData.get("contentType") as string; // "drawing", "photo", or "text"
    const text = formData.get("text") as string | null;
    const image = formData.get("image") as File | null;

    const postId = `kidpost_${Date.now()}`;
    let imageUrl = null;

    // Upload image to Supabase Storage if provided (for drawing or photo)
    if (image && image.size > 0 && contentType !== 'text') {
      const fileName = `${postId}_${image.name}`;
      const arrayBuffer = await image.arrayBuffer();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, arrayBuffer, {
          contentType: image.type,
        });

      if (uploadError) {
        throw new Error("Image upload error: " + uploadError.message);
      }

      // Create signed URL
      const { data: signedUrlData } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

      imageUrl = signedUrlData?.signedUrl || null;
    }

    const kidPost = {
      id: postId,
      type: "kid_post",
      contentType,
      text: text || undefined,
      imageUrl,
      timestamp: new Date().toISOString(),
    };

    await kv.set(`blog:${postId}`, kidPost);

    return c.json({ success: true, post: kidPost });
  } catch (error) {
    console.error("Error creating kid post:", error);
    return c.json({ error: "Failed to create kid post: " + error.message }, 500);
  }
});

// Update current trip stop
app.post("/make-server-cf1072ab/trip/stop", async (c) => {
  try {
    const { stopIndex, stopName } = await c.req.json();
    const stopData = {
      stopIndex,
      stopName,
      timestamp: new Date().toISOString(),
    };
    await kv.set("trip:stop:current", stopData);
    return c.json({ success: true, stop: stopData });
  } catch (error) {
    console.error("Error updating trip stop:", error);
    return c.json({ error: "Failed to update trip stop: " + error.message }, 500);
  }
});

// Get current trip stop
app.get("/make-server-cf1072ab/trip/stop", async (c) => {
  try {
    const stop = await kv.get("trip:stop:current");
    return c.json({ stop: stop || null });
  } catch (error) {
    console.error("Error getting trip stop:", error);
    return c.json({ error: "Failed to get trip stop: " + error.message }, 500);
  }
});

// Wipe all blog posts and images
app.delete("/make-server-cf1072ab/blog/wipe", async (c) => {
  try {
    // Get all blog posts
    const posts = await kv.getByPrefix("blog:");
    
    // Delete all images from storage
    for (const post of posts) {
      if (post.imageUrls && post.imageUrls.length > 0) {
        for (const imageUrl of post.imageUrls) {
          // Extract filename from signed URL
          const urlParts = imageUrl.split('/');
          const filenamePart = urlParts[urlParts.length - 1];
          const filename = filenamePart.split('?')[0]; // Remove query params
          
          try {
            await supabase.storage.from(bucketName).remove([filename]);
          } catch (err) {
            console.error(`Failed to delete image ${filename}:`, err);
          }
        }
      }
    }
    
    // Delete all blog post entries from KV store
    const postIds = posts.map(post => `blog:${post.id}`);
    if (postIds.length > 0) {
      await kv.mdel(postIds);
    }
    
    return c.json({ 
      success: true, 
      deletedPosts: posts.length,
      message: `Wiped ${posts.length} posts and their images` 
    });
  } catch (error) {
    console.error("Error wiping database:", error);
    return c.json({ error: "Failed to wipe database: " + error.message }, 500);
  }
});

Deno.serve(app.fetch);