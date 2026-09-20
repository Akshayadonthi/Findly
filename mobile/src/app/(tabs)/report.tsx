import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, MapPin, Phone, Check, AlertCircle } from 'lucide-react-native';
import { getCurrentUserLocation } from '../../../lib/geo';
import { mobileDbService } from '../../../lib/db';
import { ItemType } from '../../../types';
import { Colors } from '@/constants/theme';

const CATEGORIES = [
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

export default function ReportScreen() {
  const router = useRouter();

  const [type, setType] = useState<ItemType>('lost');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('Chennai');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const handlePickImage = async (useCamera: boolean) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera access is required to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: [4, 3],
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Gallery access is required to select photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: [4, 3],
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Image picker error:', err);
    }
  };

  const handleGetLocation = async () => {
    setLocating(true);
    try {
      const coords = await getCurrentUserLocation();
      setLocation(`Lat: ${coords.latitude.toFixed(4)}, Lng: ${coords.longitude.toFixed(4)}`);
      setCity('Chennai');
    } catch (err) {
      Alert.alert('Location Error', 'Unable to fetch location automatically.');
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a title for the item.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required Field', 'Please enter a detailed description.');
      return;
    }

    setSubmitting(true);
    try {
      const mockReporter = {
        id: 'mobile-user-' + Date.now().toString(36),
        name: 'Mobile Reporter',
        memberSince: 'Member',
      };

      await mobileDbService.createItem(
        {
          title: title.trim(),
          description: description.trim(),
          category,
          type,
          status: 'active',
          location: location.trim() || city,
          city: city.trim() || 'Chennai',
          date: new Date().toISOString().split('T')[0],
          whatsappNumber: whatsappNumber.trim(),
          phoneNumber: whatsappNumber.trim(),
          imageUrl: imageUri || undefined,
        },
        mockReporter
      );

      Alert.alert(
        'Report Submitted!',
        `Your ${type} item has been published live to Findly.`,
        [
          {
            text: 'View Items',
            onPress: () => router.push('/(tabs)'),
          },
        ]
      );

      // Reset Form
      setTitle('');
      setDescription('');
      setLocation('');
      setWhatsappNumber('');
      setImageUri(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish report.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Selector: Lost vs Found */}
      <Text style={styles.sectionTitle}>1. What are you reporting?</Text>
      <View style={styles.typeToggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, type === 'lost' && styles.toggleBtnLostActive]}
          onPress={() => setType('lost')}
        >
          <Text style={[styles.toggleBtnText, type === 'lost' && styles.toggleBtnTextActive]}>
            I Lost Something
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, type === 'found' && styles.toggleBtnFoundActive]}
          onPress={() => setType('found')}
        >
          <Text style={[styles.toggleBtnText, type === 'found' && styles.toggleBtnTextActive]}>
            I Found Something
          </Text>
        </TouchableOpacity>
      </View>

      {/* Item Information */}
      <Text style={styles.sectionTitle}>2. Item Details</Text>

      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Black Leather Wallet, iPhone 14 Pro"
        value={title}
        onChangeText={setTitle}
        placeholderTextColor={Colors.textMuted}
      />

      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, category === cat && styles.catChipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe the item, color, brand, distinct marks, or contents..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        placeholderTextColor={Colors.textMuted}
      />

      {/* Photo Attachment */}
      <Text style={styles.label}>Item Photo</Text>
      {imageUri ? (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
            <Text style={styles.removeImageText}>Remove Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.photoPickerRow}>
          <TouchableOpacity style={styles.photoBtn} onPress={() => handlePickImage(true)}>
            <Camera size={20} color={Colors.primary} />
            <Text style={styles.photoBtnText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.photoBtn} onPress={() => handlePickImage(false)}>
            <ImageIcon size={20} color={Colors.primary} />
            <Text style={styles.photoBtnText}>Choose Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Location & Contact Details */}
      <Text style={styles.sectionTitle}>3. Location & WhatsApp Contact</Text>

      <Text style={styles.label}>Location / Area</Text>
      <View style={styles.locationInputRow}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="e.g., T. Nagar, Central Station"
          value={location}
          onChangeText={setLocation}
          placeholderTextColor={Colors.textMuted}
        />
        <TouchableOpacity style={styles.gpsBtn} onPress={handleGetLocation} disabled={locating}>
          {locating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MapPin size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>WhatsApp Phone Number (For Direct Contact)</Text>
      <View style={styles.phoneInputRow}>
        <Phone size={18} color={Colors.textMuted} style={styles.phoneIcon} />
        <TextInput
          style={styles.phoneInput}
          placeholder="+91 9876543210"
          value={whatsappNumber}
          onChangeText={setWhatsappNumber}
          keyboardType="phone-pad"
          placeholderTextColor={Colors.textMuted}
        />
      </View>
      <Text style={styles.hintText}>
        Reachers will be able to message you directly on WhatsApp using this number.
      </Text>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Check size={20} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>Publish Report</Text>
          </>
        )}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#E8F3F1',
  },
  toggleBtnLostActive: {
    backgroundColor: Colors.danger,
  },
  toggleBtnFoundActive: {
    backgroundColor: Colors.success,
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textMuted,
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  textArea: {
    height: 90,
  },
  catScroll: {
    marginBottom: 4,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catChipText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  photoPickerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
  },
  photoBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  removeImageBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  removeImageText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsBtn: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  phoneIcon: {
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: Colors.text,
  },
  hintText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 12,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
