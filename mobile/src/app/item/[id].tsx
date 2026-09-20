import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Calendar, MessageCircle, User as UserIcon, ArrowLeft, Share2 } from 'lucide-react-native';
import { mobileDbService } from '../../../lib/db';
import { Item } from '../../../types';
import { Colors } from '@/constants/theme';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      mobileDbService.getItemById(id).then((found) => {
        setItem(found);
        setLoading(false);
      });
    }
  }, [id]);

  const openWhatsApp = () => {
    if (!item?.whatsappNumber && !item?.phoneNumber) return;
    const phone = item.whatsappNumber || item.phoneNumber || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hi! I saw your post on Findly regarding "${item.title}". Is it still available?`);
    const url = `whatsapp://send?phone=${cleanPhone}&text=${message}`;
    const fallbackUrl = `https://wa.me/${cleanPhone}?text=${message}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          return Linking.openURL(fallbackUrl);
        }
      })
      .catch(() => Linking.openURL(fallbackUrl));
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorText}>Item not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLost = (item.type || item.status) === 'lost';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Main Image */}
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: isLost ? '#FEE2E2' : '#E6F4EA' }]}>
            <Text style={[styles.placeholderBadge, { color: isLost ? Colors.danger : Colors.success }]}>
              {isLost ? 'LOST ITEM' : 'FOUND ITEM'}
            </Text>
          </View>
        )}

        <View style={styles.detailsBox}>
          {/* Badge Row */}
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: isLost ? '#FEE2E2' : '#E6F4EA' }]}>
              <Text style={[styles.typeBadgeText, { color: isLost ? Colors.danger : Colors.success }]}>
                {isLost ? 'LOST' : 'FOUND'}
              </Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{item.title}</Text>

          {/* Location & Date */}
          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <MapPin size={16} color={Colors.primary} />
              <Text style={styles.metaText}>{item.location || item.city || 'Chennai'}</Text>
            </View>

            <View style={styles.metaRow}>
              <Calendar size={16} color={Colors.primary} />
              <Text style={styles.metaText}>{item.date || 'Recent'}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.sectionHeader}>Description</Text>
          <Text style={styles.descriptionText}>{item.description}</Text>

          {/* Reporter Info */}
          <Text style={styles.sectionHeader}>Reported By</Text>
          <View style={styles.reporterBox}>
            <View style={styles.avatarCircle}>
              <UserIcon size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.reporterName}>{item.reporter?.name || 'Community Member'}</Text>
              <Text style={styles.reporterRole}>Verified Findly User</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action WhatsApp Contact Bar */}
      {item.whatsappNumber || item.phoneNumber ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.whatsappActionBtn} onPress={openWhatsApp}>
            <MessageCircle size={20} color="#FFFFFF" />
            <Text style={styles.whatsappActionText}>Chat via WhatsApp</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 80,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  heroImage: {
    width: '100%',
    height: 260,
    resizeMode: 'cover',
  },
  heroPlaceholder: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderBadge: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  detailsBox: {
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryBadge: {
    backgroundColor: '#F0F4F4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 10,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 22,
    marginBottom: 16,
  },
  reporterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4FAF9',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reporterName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  reporterRole: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  whatsappActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  whatsappActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
