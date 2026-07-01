import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const exportData: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      userId: userId,
      email: user.email,
    };

    // Fetch profile data
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    exportData.profile = profile;

    // Fetch user settings
    const { data: settings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();
    exportData.settings = settings;

    // Fetch contacts
    const { data: contacts } = await supabase
      .from("contacts")
      .select("*, contact_profile:profiles!contacts_contact_user_id_fkey(display_name, username, avatar_url)")
      .eq("user_id", userId);
    exportData.contacts = contacts;

    // Fetch contact groups
    const { data: contactGroups } = await supabase
      .from("contact_groups")
      .select("*")
      .eq("user_id", userId);
    exportData.contactGroups = contactGroups;

    // Fetch conversations the user is part of
    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id, is_pinned, is_muted, is_archived, last_read_at")
      .eq("user_id", userId);
    
    if (participations && participations.length > 0) {
      const conversationIds = participations.map(p => p.conversation_id);
      
      // Fetch conversation details
      const { data: conversations } = await supabase
        .from("conversations")
        .select("*")
        .in("id", conversationIds);
      exportData.conversations = conversations?.map(conv => ({
        ...conv,
        participation: participations.find(p => p.conversation_id === conv.id)
      }));

      // Fetch messages sent by the user
      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .eq("sender_id", userId)
        .order("created_at", { ascending: false })
        .limit(1000);
      exportData.messagesSent = messages;
    }

    // Fetch posts
    const { data: posts } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    exportData.posts = posts;

    // Fetch post comments by user
    const { data: comments } = await supabase
      .from("post_comments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    exportData.comments = comments;

    // Fetch statuses
    const { data: statuses } = await supabase
      .from("statuses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    exportData.statuses = statuses;

    // Fetch profile photos
    const { data: profilePhotos } = await supabase
      .from("profile_photos")
      .select("*")
      .eq("user_id", userId);
    exportData.profilePhotos = profilePhotos;

    // Fetch saved posts
    const { data: savedPosts } = await supabase
      .from("saved_posts")
      .select("*, post:posts(*)")
      .eq("user_id", userId);
    exportData.savedPosts = savedPosts;

    // Fetch starred messages
    const { data: starredMessages } = await supabase
      .from("starred_messages")
      .select("*, message:messages(*)")
      .eq("user_id", userId);
    exportData.starredMessages = starredMessages;

    // Fetch friend requests (sent and received)
    const { data: friendRequestsSent } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("sender_id", userId);
    exportData.friendRequestsSent = friendRequestsSent;

    const { data: friendRequestsReceived } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("receiver_id", userId);
    exportData.friendRequestsReceived = friendRequestsReceived;

    // Fetch call history
    const { data: callParticipations } = await supabase
      .from("call_participants")
      .select("*, call:calls(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);
    exportData.callHistory = callParticipations;

    // Fetch scheduled calls organized by user
    const { data: scheduledCalls } = await supabase
      .from("scheduled_calls")
      .select("*")
      .eq("organizer_id", userId);
    exportData.scheduledCalls = scheduledCalls;

    // Fetch blocked users
    const { data: blockedUsers } = await supabase
      .from("blocked_users")
      .select("*")
      .eq("blocker_id", userId);
    exportData.blockedUsers = blockedUsers;

    // Fetch device sessions
    const { data: deviceSessions } = await supabase
      .from("device_sessions")
      .select("*")
      .eq("user_id", userId);
    exportData.deviceSessions = deviceSessions;

    // Add summary
    exportData.summary = {
      totalContacts: contacts?.length || 0,
      totalConversations: participations?.length || 0,
      totalPosts: posts?.length || 0,
      totalStatuses: statuses?.length || 0,
      totalSavedPosts: savedPosts?.length || 0,
      totalStarredMessages: starredMessages?.length || 0,
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="yamilook-backup-${new Date().toISOString().split('T')[0]}.json"`
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new Response(JSON.stringify({ error: "Failed to export data" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
