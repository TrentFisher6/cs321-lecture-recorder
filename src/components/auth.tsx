//Taken from https://supabase.com/docs/guides/auth/quickstarts/react-native -Trent

import { useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { supabase } from '../lib/supabase'

// Demo accounts for testing. Create them once with the normal sign up flow -Trent
const DEMO_PASSWORD = 'demo1234'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [choosingRole, setChoosingRole] = useState(false)

  async function signInWithEmail() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) Alert.alert(error.message)
    setLoading(false)
  }

  // Debug only: one tap sign in as a demo account
  async function debugSignIn(role: 'student' | 'staff') {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: role == 'student' ? `trent+student1@gmu.edu` : `trent+staff@gmu.edu`,
      password: DEMO_PASSWORD,
    })

    if (error) Alert.alert(error.message)
    setLoading(false)
  }

  async function signUpWithEmail(role: 'student' | 'staff') {
    setLoading(true)
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: { data: { role } },
    })

    if (error) Alert.alert(error.message)
    if (!session) Alert.alert('Please check your inbox for email verification!')
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          style={styles.input}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          autoCapitalize="none"
          style={styles.input}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => signInWithEmail()}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Sign in</Text>
        </TouchableOpacity>
      </View>
      {choosingRole ? (
        <View style={styles.verticallySpaced}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={() => signUpWithEmail('student')}
            disabled={loading}
          >
            <Text style={styles.buttonText}>I am a student</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.mt20, loading && styles.buttonDisabled]}
            onPress={() => signUpWithEmail('staff')}
            disabled={loading}
          >
            <Text style={styles.buttonText}>I am staff</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.verticallySpaced}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={() => setChoosingRole(true)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Sign up</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* __DEV__ is true only in development builds -Trent */}
      {__DEV__ && (
        <View style={[styles.verticallySpaced, styles.mt20]}>
          <TouchableOpacity style={styles.debugButton} onPress={() => debugSignIn('student')} disabled={loading}>
            <Text style={styles.buttonText}>Debug: log in as student</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.debugButton, styles.mt20]}
            onPress={() => debugSignIn('staff')}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Debug: log in as staff</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#86939e',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#86939e',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2089dc',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
  },
  debugButton: {
    backgroundColor: '#86939e',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})