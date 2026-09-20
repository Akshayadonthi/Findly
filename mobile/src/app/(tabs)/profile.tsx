import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { User as UserIcon, LogOut, ShieldCheck, Phone, MapPin, Package, CheckCircle } from 'lucide-react-native';
import { auth } from '../../../lib/firebase';
import { mobileDbService } from '../../../lib/db';
import { Item } from '../../../types';
import { Colors } from '@/constants/theme';

export default function ProfileScreen() {
  const [user, setUser] = useState(auth.currentUser);
  const [myItems, setMyItems] = useState<Item[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currUser) => {
      setUser(currUser);
      if (currUser) {
        mobileDbService.getUserItems(currUser.uid).then(setMyItems);
      }
    });
    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      Alert.alert('Signed Out', 'You have been signed out of Findly.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error signing out.';
      Alert.alert('Sign Out Error', msg);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
          ) : (
            <UserIcon size={36} color="#FFFFFF" />
          )}
        </View>

        <Text style={styles.userName}>{user?.displayName || 'Findly User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'Connected via Firebase Auth (findly-d3171)'}</Text>

        <View style={styles.badgeContainer}>
          <ShieldCheck size={14} color={Colors.primary} />
          <Text style={styles.badgeText}>Verified Community Member</Text>
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{myItems.filter(i => (i.type || i.status) === 'lost').length}</Text>
          <Text style={styles.statLabel}>Lost Reported</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{myItems.filter(i => (i.type || i.status) === 'found').length}</Text>
          <Text style={styles.statLabel}>Found Reported</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{myItems.filter(i => i.status === 'returned').length}</Text>
          <Text style={styles.statLabel}>Returned</Text>
        </View>
      </View>

      {/* User Reported Items */}
      <Text style={styles.sectionTitle}>My Activity & Reports</Text>

      {myItems.length === 0 ? (
        <View style={styles.emptyMyItems}>
          <Package size={36} color={Colors.textMuted} />
          <Text style={styles.emptyMyItemsText}>You haven't reported any items yet.</Text>
        </View>
      ) : (
        myItems.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemRowTitle}>{item.title}</Text>
              <Text style={styles.itemRowMeta}>{item.category} • {item.date}</Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: item.status === 'returned' ? '#E6F4EA' : '#FFF3E0' }]}>
              <Text style={[styles.statusTagText, { color: item.status === 'returned' ? Colors.success : Colors.secondary }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
        ))
      )}

      {/* Account Settings */}
      <Text style={styles.sectionTitle}>Preferences</Text>

      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <Phone size={18} color={Colors.primary} />
          <Text style={styles.settingText}>WhatsApp Direct Link</Text>
          <CheckCircle size={16} color={Colors.success} />
        </View>

        <View style={styles.settingRow}>
          <MapPin size={18} color={Colors.primary} />
          <Text style={styles.settingText}>Geolocation Distance Sorting</Text>
          <CheckCircle size={16} color={Colors.success} />
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <LogOut size={18} color={Colors.danger} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F3F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 10,
  },
  emptyMyItems: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  emptyMyItemsText: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  itemRowTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  itemRowMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  signOutText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
