import { useParams, useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";

import {
  Sheet,
  Typography,
  Stack,
  Card,
  CardContent,
  AspectRatio,
  Divider,
  Avatar,
  IconButton,
  Button,
  Box,
  Modal,
  ModalDialog,
  FormControl,
  FormLabel,
  Select,
  Option,
  Input,
  Textarea,
} from "@mui/joy";

import Dropdown from "@mui/joy/Dropdown";
import Menu from "@mui/joy/Menu";
import MenuButton from "@mui/joy/MenuButton";
import MenuItem from "@mui/joy/MenuItem";

import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlined";
import { useState } from "react";

type Post = {
  id: string;
  title: string;
  content: string;
  image?: string | null;
  type: "text" | "image";
  communityId: string;
  userId: string;
  likes?: string[];
};

type Comment = {
  id: string;
  postId: string;
  content: string;
};

export default function CommunityPage() {
  const { communityId } = useParams();

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [openCreatePost, setOpenCreatePost] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"text" | "image">("text");
  const [imageUrl, setImageUrl] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = String(user?.id);

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data;
    },
  });

  const getUserName = (userId: string) => {
    const user = users.find((u: any) => String(u.id) === String(userId));

    return user?.name || "Unknown User";
  };

  const { data: community } = useQuery({
    queryKey: ["community", communityId],
    queryFn: async () => {
      const res = await api.get(`/communities/${communityId}`);
      return res.data;
    },
    enabled: !!communityId,
  });

  const communityColor = community?.color || "#3b82f6";

  const { data: posts = [] } = useQuery({
    queryKey: ["community-posts", communityId],
    queryFn: async () => {
      const res = await api.get(`/posts?communityId=${communityId}`);
      return res.data;
    },
    enabled: !!communityId,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["comments"],
    queryFn: async () => {
      const res = await api.get("/comments");
      return res.data;
    },
  });
  const createPost = async () => {
    if (!title.trim()) return;

    // For text posts, content is required
    if (postType === "text" && !content.trim()) return;

    // For image posts, either content or image URL must exist
    if (postType === "image" && !imageUrl.trim()) return;

    const newPost = {
      userId: user.id,
      communityId,
      type: postType,
      title,
      content: content.trim(),
      image: postType === "image" ? imageUrl : null,
      likes: [],
      createdAt: new Date().toISOString(),
    };

    await api.post("/posts", newPost);

    await queryClient.invalidateQueries({
      queryKey: ["community-posts", communityId],
    });

    setOpenCreatePost(false);
    setTitle("");
    setContent("");
    setImageUrl("");
    setPostType("text");
  };
  const getCommentsCount = (postId: string) =>
    comments.filter((c: Comment) => c.postId === postId).length;

  const toggleLike = async (post: Post) => {
    queryClient.setQueryData(
      ["community-posts", communityId],
      (old: Post[] = []) =>
        old.map((p) => {
          if (p.id !== post.id) return p;

          const likes = p.likes || [];
          const liked = likes.includes(userId);

          return {
            ...p,
            likes: liked
              ? likes.filter((id) => id !== userId)
              : [...likes, userId],
          };
        }),
    );

    try {
      const currentLikes = post.likes || [];
      const liked = currentLikes.includes(userId);

      await api.patch(`/posts/${post.id}`, {
        likes: liked
          ? currentLikes.filter((id) => id !== userId)
          : [...currentLikes, userId],
      });

      queryClient.invalidateQueries({
        queryKey: ["community-posts", communityId],
      });
    } catch {
      queryClient.invalidateQueries({
        queryKey: ["community-posts", communityId],
      });
    }
  };

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
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography
            level="h4"
            sx={{
              cursor: "pointer",
              "&:hover": {
                opacity: 0.8,
              },
            }}
            onClick={() => navigate("/home")}
          >
            Uniforum
          </Typography>

          {community && (
            <Typography
              level="title-lg"
              sx={{
                color: communityColor,
                fontWeight: "lg",
              }}
            >
              / {community.name}
            </Typography>
          )}
        </Stack>

        <Dropdown>
          <MenuButton
            slots={{ root: Avatar }}
            slotProps={{
              root: { sx: { cursor: "pointer" } },
            }}
          >
            {user?.name?.charAt(0) || "U"}
          </MenuButton>

          <Menu placement="bottom-end">
            <MenuItem disabled>
              Logged in as <b>{user?.name || "User"}</b>
            </MenuItem>

            <MenuItem color="danger" onClick={logout}>
              Logout
            </MenuItem>
          </Menu>
        </Dropdown>
      </Sheet>
      <Sheet
        sx={{
          height: 120,
          background: `linear-gradient(135deg, ${communityColor}, ${communityColor}cc)`,
          display: "flex",
          alignItems: "flex-end",
          px: 4,
          py: 3,
          color: "white",
        }}
      >
        <Stack spacing={0.5}>
          <Typography level="h2" sx={{ color: "white" }}>
            {community?.name}
          </Typography>

          <Typography sx={{ color: "rgba(255,255,255,0.8)" }}>
            {community?.code}
          </Typography>
        </Stack>
      </Sheet>

      {/* MAIN */}
      {/* MAIN */}
      <Stack
        direction="row"
        spacing={2}
        sx={{
          maxWidth: 1200,
          mx: "auto",
          px: 2,
          py: 3,
          alignItems: "flex-start",
        }}
      >
        {/* FEED */}
        <Stack spacing={2} sx={{ flex: 1 }}>
          <Stack
            direction="row"
            justifyContent="flex-end"
            alignItems="center"
            gap="16px"
          >
            <Typography level="body-sm">Want to contribute?</Typography>

            <Button
              onClick={() => setOpenCreatePost(true)}
              sx={{
                bgcolor: communityColor,
                "&:hover": {
                  opacity: 0.9,
                },
              }}
            >
              Create Post
            </Button>
          </Stack>

          <Divider />

          {[...posts].reverse().map((post: Post) => (
            <Card key={post.id}>
              <CardContent>
                <div
                  onClick={() => navigate(`/post/${post.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: "bold",
                        fontSize: "24px",
                      }}
                    >
                      {post.title}
                    </Typography>

                    <Typography
                      level="body-sm"
                      sx={{
                        color: "text.secondary",
                        whiteSpace: "nowrap",
                      }}
                    >
                      criado por {getUserName(post.userId)}
                    </Typography>
                  </Box>

                  <Typography level="body-sm" sx={{ mt: 1 }}>
                    {post.content}
                  </Typography>

                  {post.type === "image" && post.image && (
                    <AspectRatio ratio="16/9" sx={{ mt: 2 }}>
                      <img src={post.image} alt={post.title} />
                    </AspectRatio>
                  )}
                </div>

                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    mt: 2,
                    pt: 1,
                    borderTop: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {/* LIKES */}
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton
                      size="sm"
                      variant={post.likes?.includes(userId) ? "soft" : "plain"}
                      color={
                        post.likes?.includes(userId) ? "primary" : "neutral"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(post);
                      }}
                    >
                      {post.likes?.includes(userId) ? (
                        <ThumbUpIcon />
                      ) : (
                        <ThumbUpOutlinedIcon />
                      )}
                    </IconButton>

                    <Typography level="body-sm">
                      {post.likes?.length || 0}
                    </Typography>
                  </Stack>

                  {/* COMMENTS */}
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton
                      size="sm"
                      variant="plain"
                      onClick={() => navigate(`/post/${post.id}`)}
                    >
                      <ChatBubbleOutlineIcon />
                    </IconButton>

                    <Typography level="body-sm">
                      {getCommentsCount(post.id)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 2,
            }}
          >
            <Typography sx={{ color: "#717171" }}>Você já viu tudo.</Typography>
          </Box>
        </Stack>

        {/* SIDEBAR */}
        <Sheet
          sx={{
            width: 300,
            p: 2,
            borderRadius: "md",
            boxShadow: "sm",
            height: "fit-content",
            position: "sticky",
            top: 80,
            bgcolor: "background.surface",
          }}
        >
          <Typography
            level="title-md"
            sx={{
              color: communityColor,
              fontWeight: "lg",
            }}
          >
            Sobre a comunidade
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={2}>
            <div>
              <Typography level="body-xs" sx={{ opacity: 0.6 }}>
                Professor
              </Typography>

              <Typography level="body-sm">{community?.professor}</Typography>
            </div>

            <div>
              <Typography level="body-xs" sx={{ opacity: 0.6 }}>
                Descrição
              </Typography>

              <Typography level="body-sm">{community?.description}</Typography>
            </div>

            <div>
              <Typography level="body-xs" sx={{ opacity: 0.6 }}>
                Código
              </Typography>

              <Typography level="body-sm">{community?.code}</Typography>
            </div>
          </Stack>
        </Sheet>
      </Stack>
      <Modal open={openCreatePost} onClose={() => setOpenCreatePost(false)}>
        <ModalDialog
          sx={{
            width: 600,
            maxWidth: "95vw",
          }}
        >
          <Typography level="h4">Create Post</Typography>

          <Stack spacing={2} mt={1}>
            <FormControl>
              <FormLabel>Post Type</FormLabel>

              <Select
                value={postType}
                onChange={(_, value) => setPostType(value as "text" | "image")}
              >
                <Option value="text">Text</Option>

                <Option value="image">Image</Option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Title</FormLabel>

              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormControl>

            <FormControl>
              <FormLabel>Content</FormLabel>

              <Textarea
                minRows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </FormControl>

            {postType === "image" && (
              <FormControl>
                <FormLabel>Image URL</FormLabel>

                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </FormControl>
            )}

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="plain" onClick={() => setOpenCreatePost(false)}>
                Cancel
              </Button>

              <Button onClick={createPost}>Post</Button>
            </Stack>
          </Stack>
        </ModalDialog>
      </Modal>
    </Sheet>
  );
}
