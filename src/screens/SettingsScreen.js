import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Switch, 
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';
import { useTheme } from '../utils/ThemeContext';

const SettingsScreen = () => {
  const { logout, user, useFirebase, setStorageMethod } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };
  
  // Confirm logout
  const confirmLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: handleLogout,
          style: 'destructive',
        },
      ]
    );
  };
  
  // Toggle storage method
  const toggleStorageMethod = () => {
    Alert.alert(
      'Change Storage Method',
      `Are you sure you want to switch to ${useFirebase ? 'local storage' : 'Firebase'}? This will log you out.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Switch',
          onPress: async () => {
            await setStorageMethod(useFirebase ? 'local' : 'firebase');
            await logout();
          },
        },
      ]
    );
  };
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
        
        <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
          <View style={styles.settingInfo}>
            <Ionicons name="person-outline" size={22} color={theme.primary} style={styles.settingIcon} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>Name</Text>
          </View>
          <Text style={[styles.settingValue, { color: theme.placeholder }]}>{user.displayName}</Text>
        </View>
        
        <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
          <View style={styles.settingInfo}>
            <Ionicons name="mail-outline" size={22} color={theme.primary} style={styles.settingIcon} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>Email</Text>
          </View>
          <Text style={[styles.settingValue, { color: theme.placeholder }]}>{user.email}</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
        
        <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
          <View style={styles.settingInfo}>
            <Ionicons 
              name={isDark ? "moon-outline" : "sunny-outline"} 
              size={22} 
              color={theme.primary} 
              style={styles.settingIcon} 
            />
            <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.placeholder, true: theme.primary }}
            thumbColor={theme.background}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Storage</Text>
        
        <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
          <View style={styles.settingInfo}>
            <Ionicons 
              name={useFirebase ? "cloud-outline" : "phone-portrait-outline"} 
              size={22} 
              color={theme.primary} 
              style={styles.settingIcon} 
            />
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              {useFirebase ? 'Using Firebase' : 'Using Local Storage'}
            </Text>
          </View>
          <Switch
            value={!useFirebase}
            onValueChange={toggleStorageMethod}
            trackColor={{ false: theme.placeholder, true: theme.primary }}
            thumbColor={theme.background}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
        
        <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
          <View style={styles.settingInfo}>
            <Ionicons name="information-circle-outline" size={22} color={theme.primary} style={styles.settingIcon} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>Version</Text>
          </View>
          <Text style={[styles.settingValue, { color: theme.placeholder }]}>1.0.0</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: theme.error }]}
        onPress={confirmLogout}
      >
        <Ionicons name="log-out-outline" size={22} color="white" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginVertical: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    marginVertical: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
