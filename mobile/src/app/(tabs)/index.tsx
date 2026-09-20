import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, MapPin, Calendar, MessageCircle, Phone, Filter } from 'lucide-react-native';
import { mobileDbService } from '../../../lib/db';
import { Item, ItemType } from '../../../types';
import { Colors } from '@/constants/theme';

const CATEGORIES = [
  'All',
  'Electronics',
  'Bags & Backpacks',
  'Keys',
  'Wallets & Purses',
  'Watches & Jewelry',
  'Documents & IDs',
  'Accessories',
  'Clothing',
  'Other',
];

export default function BrowseScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | ItemType>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const filterCat = selectedCategory === 'All' ? '' : selectedCategory;
      const data = await mobileDbService.getItems({
        searchQuery,
        type: selectedType,
        category: filterCat,
        city: '',
        location: '',
        date: '',
        sortBy: 'newest',
      });
      setItems(data);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedType, selectedCategory]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const openWhatsApp = (phone?: string, title?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hi! I saw your post on Findly regarding "${title}". Is it still available?`);
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

  const renderItem = ({ item }: { item: Item }) => {
    const isLost = (item.type || item.status) === 'lost';
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push(`/item/${item.id}`)}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImagePlaceholder, { backgroundColor: isLost ? '#FEE2E2' : '#E6F4EA' }]}>
            <Text style={[styles.placeholderText, { color: isLost ? Colors.danger : Colors.success }]}>
              {isLost ? 'LOST' : 'FOUND'}
            </Text>
          </View>
        )}

        <View style={styles.cardContent}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: isLost ? '#FEE2E2' : '#E6F4EA' }]}>
              <Text style={[styles.badgeText, { color: isLost ? Colors.danger : Colors.success }]}>
                {isLost ? 'LOST ITEM' : 'FOUND ITEM'}
              </Text>
            </View>
            <Text style={styles.categoryBadge}>{item.category}</Text>
          </View>

          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>

          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MapPin size={14} color={Colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.location || item.city || 'Chennai'}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Calendar size={14} color={Colors.textMuted} />
              <Text style={styles.metaText}>{item.date || 'Recent'}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.reporterName}>By {item.reporter?.name || 'Community Member'}</Text>
            
            {item.whatsappNumber || item.phoneNumber ? (
              <TouchableOpacity
                style={styles.waButton}
                onPress={() => openWhatsApp(item.whatsappNumber || item.phoneNumber, item.title)}
              >
                <MessageCircle size={14} color="#FFFFFF" />
                <Text style={styles.waButtonText}>WhatsApp</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.headerBox}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search lost or found items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* Type Filter Buttons */}
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, selectedType === 'all' && styles.typeBtnActive]}
            onPress={() => setSelectedType('all')}
          >
            <Text style={[styles.typeBtnText, selectedType === 'all' && styles.typeBtnTextActive]}>
              All Items
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeBtn, selectedType === 'lost' && styles.typeBtnLostActive]}
            onPress={() => setSelectedType('lost')}
          >
            <Text style={[styles.typeBtnText, selectedType === 'lost' && styles.typeBtnTextActive]}>
              Lost Items
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeBtn, selectedType === 'found' && styles.typeBtnFoundActive]}
            onPress={() => setSelectedType('found')}
          >
            <Text style={[styles.typeBtnText, selectedType === 'found' && styles.typeBtnTextActive]}>
              Found Items
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Horizontal Scroll */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(cat) => cat}
          style={styles.catList}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Main Feed */}
      {loading && !refreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading reported items...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Filter size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No items reported yet</Text>
              <Text style={styles.emptySubtitle}>
                {selectedType === 'all'
                  ? 'Be the first to report a lost or found item in your community.'
                  : `No ${selectedType} items reported matching your filter.`}
              </Text>
              <TouchableOpacity
                style={styles.reportRedirectBtn}
                onPress={() => router.push('/(tabs)/report')}
              >
                <Text style={styles.reportRedirectText}>Report Item Now</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBox: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F4',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: Colors.text,
  },
  typeRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F0F4F4',
  },
  typeBtnActive: {
    backgroundColor: Colors.primary,
  },
  typeBtnLostActive: {
    backgroundColor: Colors.danger,
  },
  typeBtnFoundActive: {
    backgroundColor: Colors.success,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  catList: {
    marginTop: 10,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0F4F4',
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
  },
  catChipText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  cardContent: {
    padding: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryBadge: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    marginTop: 4,
  },
  reporterName: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  waButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  waButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textMuted,
    fontSize: 14,
  },
  emptyBox: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  reportRedirectBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  reportRedirectText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
