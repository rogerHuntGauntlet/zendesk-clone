import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { message: 'REPLICATE_API_TOKEN is not configured' },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { message: 'SUPABASE_SERVICE_ROLE_KEY is not configured' },
        { status: 500 }
      );
    }

    const { prompt, projectType } = await req.json();

    if (!prompt || !projectType) {
      return NextResponse.json(
        { message: 'Missing required fields: prompt and projectType' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if we already have a video for this project type
    const { data: existingVideos, error: listError } = await supabase
      .storage
      .from('zen_tutorial_videos')
      .list(`${projectType.toLowerCase()}/`);

    if (listError) {
      console.error('Error listing videos:', listError);
      return NextResponse.json(
        { message: 'Failed to check existing videos' },
        { status: 500 }
      );
    }

    if (existingVideos && existingVideos.length > 0) {
      // Return the URL of the existing video
      const { data: { publicUrl } } = supabase
        .storage
        .from('zen_tutorial_videos')
        .getPublicUrl(`${projectType.toLowerCase()}/${existingVideos[0].name}`);
      
      return NextResponse.json({ videoUrl: publicUrl });
    }

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log('Generating video with prompt:', prompt);

    // Using Zeroscope v2 XL model instead
    const videoUrl = await replicate.run(
      "anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
      {
        input: {
          prompt: `Professional screencast showing ${projectType.toLowerCase()} interface, modern UI design, clean layout, business software tutorial`,
          fps: 24,
          num_frames: 48, // 2 seconds at 24fps
          width: 1024,
          height: 576
        }
      }
    );

    if (!videoUrl) {
      return NextResponse.json(
        { message: 'Failed to generate video with Replicate' },
        { status: 500 }
      );
    }

    console.log('Video generated:', videoUrl);

    // Download the video
    const response = await fetch(videoUrl as string);
    if (!response.ok) {
      return NextResponse.json(
        { message: 'Failed to download generated video' },
        { status: 500 }
      );
    }

    const videoBlob = await response.blob();
    const arrayBuffer = await videoBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate a unique filename
    const filename = `${projectType.toLowerCase()}/tutorial-${Date.now()}.mp4`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('zen_tutorial_videos')
      .upload(filename, buffer, {
        contentType: 'video/mp4',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { message: 'Failed to upload video to storage' },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('zen_tutorial_videos')
      .getPublicUrl(filename);

    return NextResponse.json({ 
      videoUrl: publicUrl,
      stored: true
    });
  } catch (error) {
    console.error('Error in generate-video:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
