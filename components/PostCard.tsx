import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Post } from '../context/PostsContext';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

function Avatar({ username }: { username: string }) {
  const initials = username.slice(0, 2).toUpperCase();
  // Deterministic color from username
  const colors = ['#7c6af7', '#4a90e2', '#50c878', '#f5a623', '#e91e63', '#00bcd4', '#ff9800'];
  const color = colors[username.charCodeAt(0) % colors.length];
  return (
    <View style={[styles.avatar, { backgroundColor: color }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

interface Props {
  post: Post;
  onLike: () => void;
  onTickerPress: (ticker: string) => void;
}

export default function PostCard({ post, onLike, onTickerPress }: Props) {
  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.header}>
        <Avatar username={post.username} />
        <View style={styles.headerInfo}>
          <Text style={styles.username}>{post.username}</Text>
          {post.ticker && (
            <TouchableOpacity onPress={() => onTickerPress(post.ticker!)} activeOpacity={0.7}>
              <Text style={styles.tickerChip}>${post.ticker}</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.timeAgo}>{timeAgo(post.created_at)}</Text>
      </View>

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.likeBtn} onPress={onLike} activeOpacity={0.7}>
          <Text style={[styles.likeHeart, post.liked && styles.likeHeartActive]}>
            {post.liked ? '♥' : '♡'}
          </Text>
          <Text style={[styles.likeCount, post.liked && styles.likeCountActive]}>
            {post.likes_count}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16162a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#22223a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  username: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  tickerChip: {
    color: '#7c6af7',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: '#7c6af715',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    letterSpacing: 0.3,
  },
  timeAgo: {
    color: '#7878a0',
    fontSize: 12,
    flexShrink: 0,
  },
  content: {
    color: '#e0e0f0',
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0.1,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 4,
  },
  likeHeart: {
    fontSize: 18,
    color: '#7878a0',
  },
  likeHeartActive: {
    color: '#FF4458',
  },
  likeCount: {
    color: '#7878a0',
    fontSize: 13,
    fontWeight: '600',
  },
  likeCountActive: {
    color: '#FF4458',
  },
});
