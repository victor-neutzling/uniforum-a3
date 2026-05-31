import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";

import {
  Sheet,
  Typography,
  Stack,
  Card,
  CardContent,
  Button,
  Input,
  Divider,
  Avatar,
  IconButton,
  Box,
  AspectRatio,
} from "@mui/joy";

import Dropdown from "@mui/joy/Dropdown";
import Menu from "@mui/joy/Menu";
import MenuButton from "@mui/joy/MenuButton";
import MenuItem from "@mui/joy/MenuItem";

import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";

type Comment = {
  id: string;
  postId: string;
  userId: string;
  content: string;
  likes?: string[];
};

type User = {
  id: string;
  name: string;
};

export default function PostPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // 🔥 ALWAYS STRING
  const userId = String(user?.id);
  const safePostId = String(postId);

  const [commentText, setCommentText] = useState("");

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // POST
  const { data: post } = useQuery({
    queryKey: ["post", safePostId],
    queryFn: async () => {
      const res = await api.get(`/posts/${safePostId}`);
      return res.data;
    },
    enabled: !!safePostId,
  });

  // COMMENTS
  const { data: comments = [] } = useQuery({
    queryKey: ["comments", safePostId],
    queryFn: async () => {
      const res = await api.get(`/comments?postId=${safePostId}`);
      return res.data;
    },
    enabled: !!safePostId,
  });

  // USERS
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data;
    },
  });

  const getUserName = (id: string) => {
    const u = users.find((x: User) => String(x.id) === String(id));
    return u?.name || "Unknown";
  };

  // POST LIKE
  const toggleLike = async () => {
    if (!post || !userId) return;

    const likes: string[] = (post.likes || []).map(String);

    const alreadyLiked = likes.includes(userId);

    const updatedLikes = alreadyLiked
      ? likes.filter((id) => id !== userId)
      : [...likes, userId];

    await api.patch(`/posts/${post.id}`, {
      likes: updatedLikes,
    });

    queryClient.invalidateQueries({ queryKey: ["post", safePostId] });
  };

  // COMMENT LIKE
  const toggleCommentLike = async (comment: Comment) => {
    const likes: string[] = (comment.likes || []).map(String);

    const alreadyLiked = likes.includes(userId);

    const updatedLikes = alreadyLiked
      ? likes.filter((id) => id !== userId)
      : [...likes, userId];

    await api.patch(`/comments/${comment.id}`, {
      likes: updatedLikes,
    });

    queryClient.invalidateQueries({ queryKey: ["comments", safePostId] });
  };

  // ADD COMMENT
  const addComment = async () => {
    if (!commentText.trim()) return;

    const newComment = {
      postId: safePostId,
      userId: userId,
      content: commentText,
      likes: [],
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    queryClient.setQueryData<Comment[]>(
      ["comments", safePostId],
      (old = []) => [
        ...old,
        { ...newComment, id: Math.random().toString(36).substring(2, 9) }, // temporary id
      ],
    );

    setCommentText("");

    // Actually send to server
    await api.post("/comments", newComment);

    // Refetch to sync with DB
    queryClient.invalidateQueries({ queryKey: ["comments", safePostId] });
  };
  // SORT COMMENTS
  const sortedComments = useMemo(() => {
    return [...comments].sort(
      (a: Comment, b: Comment) =>
        (b.likes?.length || 0) - (a.likes?.length || 0),
    );
  }, [comments]);

  if (!post) return <div>Carregando...</div>;

  return (
    <Sheet sx={{ minHeight: "100vh", bgcolor: "background.body" }}>
      {/* HEADER */}
      <Sheet
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          py: 1.5,
          boxShadow: "sm",
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.surface",
        }}
      >
        <Typography level="h4">Uniforum</Typography>

        <Dropdown>
          <MenuButton
            slots={{ root: Avatar }}
            slotProps={{ root: { sx: { cursor: "pointer" } } }}
          >
            {user?.name?.charAt(0) || "U"}
          </MenuButton>

          <Menu placement="bottom-end">
            <MenuItem disabled>
              Logado como <b>{user?.name || "User"}</b>
            </MenuItem>
            <MenuItem color="danger" onClick={logout}>
              Sair
            </MenuItem>
          </Menu>
        </Dropdown>
      </Sheet>

      {/* CONTENT SHEET */}
      <Sheet
        sx={{
          maxWidth: 900,
          mx: "auto",
          mt: 3,
          p: 3,
          borderRadius: "lg",
          boxShadow: "lg",
          bgcolor: "background.surface",
        }}
      >
        {/* BACK */}
        <Button
          size="sm"
          variant="outlined"
          onClick={() => navigate("/home")}
          sx={{ mb: 2, width: "fit-content" }}
        >
          ← voltar
        </Button>

        {/* POST */}
        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                gap: "16px",
                alignItems: "center",
              }}
            >
              <Typography level="h3">{post.title}</Typography>
              <Typography
                level="body-sm"
                sx={{
                  color: "text.muted",
                  fontWeight: "lg",
                }}
              >
                por {getUserName(String(post.userId))}
              </Typography>
            </Box>

            <Typography level="body-md" sx={{ mt: 1 }}>
              {post.content}
            </Typography>

            {post.type === "image" && post.image && (
              <AspectRatio ratio="16/9" sx={{ mt: 2 }}>
                <img
                  src={post.image}
                  alt={post.title}
                  style={{ objectFit: "cover" }}
                />
              </AspectRatio>
            )}

            {/* LIKE POST */}
            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 2, cursor: "pointer" }}
              onClick={toggleLike}
            >
              <IconButton
                size="sm"
                color={
                  (post.likes || []).map(String).includes(userId)
                    ? "primary"
                    : "neutral"
                }
                variant={
                  (post.likes || []).map(String).includes(userId)
                    ? "soft"
                    : "plain"
                }
                sx={{
                  mt: 2,
                  transition: "all .2s ease",
                  "&:active": {
                    transform: "scale(0.9)",
                  },
                }}
                onClick={toggleLike}
              >
                {(post.likes || []).map(String).includes(userId) ? (
                  <ThumbUpIcon />
                ) : (
                  <ThumbUpOutlinedIcon />
                )}

                <Typography level="body-sm" sx={{ ml: 0.5 }}>
                  {post.likes?.length || 0}
                </Typography>
              </IconButton>
            </Stack>
          </CardContent>
        </Card>

        {/* COMMENTS */}
        <Sheet sx={{ mt: 3 }}>
          <Typography level="title-md">Comentários</Typography>
          <Divider sx={{ my: 1 }} />

          <Stack direction="row" spacing={1}>
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              sx={{ flex: 1 }}
            />
            <Button onClick={addComment}>Criar</Button>
          </Stack>

          <Stack spacing={1} sx={{ mt: 2 }}>
            {sortedComments.map((c: Comment) => (
              <Sheet
                key={c.id}
                sx={{
                  p: 1.5,
                  borderRadius: "sm",
                  bgcolor: "background.level1",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography
                    level="body-sm"
                    fontWeight="lg"
                    sx={{ color: "text.secondary" }}
                  >
                    {getUserName(c.userId)}
                  </Typography>

                  <IconButton
                    size="sm"
                    color={
                      (c.likes || []).map(String).includes(userId)
                        ? "primary"
                        : "neutral"
                    }
                    variant={
                      (c.likes || []).map(String).includes(userId)
                        ? "soft"
                        : "plain"
                    }
                    sx={{
                      transition: "all .2s ease",
                      "&:active": {
                        transform: "scale(0.9)",
                      },
                    }}
                    onClick={() => toggleCommentLike(c)}
                  >
                    {(c.likes || []).map(String).includes(userId) ? (
                      <ThumbUpIcon />
                    ) : (
                      <ThumbUpOutlinedIcon />
                    )}

                    <Typography level="body-xs" sx={{ ml: 0.5 }}>
                      {c.likes?.length || 0}
                    </Typography>
                  </IconButton>
                </Stack>

                <Typography level="body-sm">{c.content}</Typography>
              </Sheet>
            ))}
          </Stack>
        </Sheet>
      </Sheet>
    </Sheet>
  );
}
