import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../navigation/AuthStack';
import { friendlyAuthError } from '../lib/authErrors';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

const TERMS_SECTIONS = [
  {
    title: '1. Account Eligibility',
    body: 'To open and maintain an account with Stockr, you must be at least 18 years of age and a legal resident of the United States or a jurisdiction in which Stockr is authorized to offer services. By creating an account, you represent and warrant that you meet these eligibility requirements and have the full legal capacity to enter into this agreement. Stockr reserves the right to verify your identity and eligibility at any time.',
  },
  {
    title: '2. Acceptance of Terms',
    body: 'By creating an account, accessing, or using any Stockr service, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions, our Privacy Policy, and any additional terms applicable to specific services. These Terms constitute a legally binding agreement between you and Stockr, Inc. If you do not agree to these Terms, you must not use our services.',
  },
  {
    title: '3. Investment Risk Disclosure',
    body: 'Investing in securities involves substantial risk, including the possible loss of the entire principal amount invested. Past performance of any investment is not indicative of future results. Market prices of securities are volatile and may be influenced by numerous factors beyond our control, including economic conditions, geopolitical events, regulatory changes, and company-specific developments. Stockr does not guarantee any level of performance or that any investment strategy will be profitable. You should carefully consider your investment objectives, risk tolerance, financial situation, and investment time horizon before investing.',
  },
  {
    title: '4. No Investment Advice',
    body: 'Stockr provides a technology platform for informational and educational purposes only. Nothing on this platform constitutes investment advice, a solicitation, recommendation, or offer to buy or sell any security. Any content, data, analysis, or tools provided are for informational purposes only and should not be relied upon as the basis for investment decisions. You are solely responsible for evaluating the merits and risks associated with any investment decision you make. We strongly recommend consulting with a qualified financial advisor, tax professional, or legal counsel before making any investment.',
  },
  {
    title: '5. Account Security',
    body: 'You are solely responsible for maintaining the confidentiality of your account credentials, including your username and password. You agree to notify Stockr immediately of any unauthorized access to or use of your account. Stockr will not be liable for any loss or damage arising from your failure to safeguard your account credentials. You are responsible for all activities that occur under your account, whether or not authorized by you. You must not share your credentials with any third party or use another user\'s account without permission.',
  },
  {
    title: '6. Prohibited Activities',
    body: 'You agree not to engage in any activity that violates applicable laws or regulations, including but not limited to: market manipulation, wash trading, front-running, insider trading, or any other form of fraudulent or deceptive trading practices. You may not use our platform to launder money, finance terrorism, or engage in any illegal activity. Automated trading systems, bots, scraping tools, or other non-human access methods are strictly prohibited without prior written consent from Stockr. Violation of these prohibitions may result in immediate account termination and referral to appropriate regulatory authorities.',
  },
  {
    title: '7. Privacy Policy',
    body: 'Stockr collects personal information necessary to provide our services, comply with legal obligations, and improve our platform. This includes, but is not limited to, your name, email address, financial information, and usage data. We may share your information with third-party service providers, regulatory bodies, law enforcement when required by law, and affiliated companies. We implement reasonable security measures to protect your information, but cannot guarantee absolute security. By using our services, you consent to our collection, use, and sharing of your information as described in our full Privacy Policy, which is incorporated into these Terms by reference.',
  },
  {
    title: '8. Tax Obligations',
    body: 'You are solely responsible for determining any tax obligations arising from your use of Stockr and your investment activities, and for filing appropriate tax returns and paying any taxes due. Stockr may be required to report certain transactions to tax authorities as required by applicable law, including reporting to the IRS via Form 1099-B and other applicable forms. We do not provide tax advice. You should consult with a qualified tax professional regarding your specific tax situation.',
  },
  {
    title: '9. Service Availability',
    body: 'Stockr does not warrant that the platform will be available at all times, error-free, or uninterrupted. We reserve the right to suspend, restrict, or terminate access to our services at any time, including during periods of extreme market volatility, system maintenance, or regulatory review. Stockr shall not be liable for any losses, damages, or missed opportunities resulting from service unavailability, system errors, delays in order execution, or any other technical failure, whether or not within our reasonable control.',
  },
  {
    title: '10. Termination',
    body: 'Stockr reserves the right to suspend or terminate your account at any time, with or without cause, and with or without notice, including for violations of these Terms, suspicious activity, inactivity, legal or regulatory requirements, or business reasons. Upon termination, your right to use our services will immediately cease. Provisions of these Terms that by their nature should survive termination, including without limitation, disclaimers, indemnification, and limitations of liability, shall survive any termination of these Terms.',
  },
  {
    title: '11. Governing Law',
    body: 'These Terms and Conditions shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions. Any dispute arising under or related to these Terms shall be subject to the exclusive jurisdiction of the state and federal courts located in Delaware. You waive any objection to the laying of venue of any such dispute in Delaware and waive any claim that any such dispute brought in such court has been brought in an inconvenient forum.',
  },
  {
    title: '12. Changes to Terms',
    body: 'Stockr reserves the right to modify or replace these Terms at any time at our sole discretion. We will provide notice of material changes by posting the updated Terms on our platform and updating the "Last Updated" date. Your continued use of our services after any such changes constitutes your acceptance of the new Terms. If you do not agree to the modified Terms, you must stop using our services and may request account closure. It is your responsibility to review these Terms periodically for any changes.',
  },
];

export default function SignUpScreen() {
  const navigation = useNavigation<Nav>();
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'terms'>('form');
  const [agreed, setAgreed] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const handleNext = () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError(null);
    setStep('terms');
  };

  const handleAgreeAndCreate = async () => {
    setLoading(true);
    setError(null);
    const err = await signUp(email.trim(), password);
    setLoading(false);
    if (err) {
      setStep('form');
      setError(friendlyAuthError(err.message));
    }
  };

  if (step === 'terms') {
    return (
      <View style={styles.page}>
        <View style={styles.termsWrapper}>
          {/* Back button — only pinned element at top */}
          <View style={styles.termsTopBar}>
            <TouchableOpacity onPress={() => setStep('form')} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          </View>

          {/* Everything else scrolls */}
          <ScrollView
            style={styles.termsScroll}
            contentContainerStyle={styles.termsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsSubtitle}>Please read carefully before creating your account.</Text>

            {TERMS_SECTIONS.map((section) => (
              <View key={section.title} style={styles.termsSection}>
                <Text style={styles.termsSectionTitle}>{section.title}</Text>
                <Text style={styles.termsSectionBody}>{section.body}</Text>
              </View>
            ))}

            {/* Checkbox inside scroll so user must read to reach it */}
            <View style={styles.checkboxDivider} />
            {error && <Text style={styles.error}>{error}</Text>}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I have read and agree to the Terms &amp; Conditions and confirm I am{' '}
                <Text style={styles.checkboxLabelBold}>18 years of age or older.</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Only the button is pinned at bottom */}
          <View style={styles.termsFooter}>
            <TouchableOpacity
              style={[styles.button, (!agreed || loading) && styles.buttonDisabled]}
              onPress={handleAgreeAndCreate}
              disabled={!agreed || loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Agree &amp; Create Account</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Text style={styles.logo}>Stockr</Text>
        <Text style={styles.subtitle}>Create your account</Text>

        <TextInput
          style={[styles.input, emailFocused && styles.inputFocused]}
          placeholder="Email"
          placeholderTextColor="#3d3d5c"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
        />

        <TextInput
          style={[styles.input, passwordFocused && styles.inputFocused]}
          placeholder="Password"
          placeholderTextColor="#3d3d5c"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
        />

        <TextInput
          style={[styles.input, confirmFocused && styles.inputFocused]}
          placeholder="Confirm Password"
          placeholderTextColor="#3d3d5c"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          onFocus={() => setConfirmFocused(true)}
          onBlur={() => setConfirmFocused(false)}
          onSubmitEditing={handleNext}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Sign in</Text></Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  container: {
    width: Platform.OS === 'web' ? 390 : '100%',
    paddingHorizontal: 28,
    alignItems: 'stretch',
  },
  logo: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#3d3d5c',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 36,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#12122a',
    color: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#22223a',
  },
  inputFocused: {
    borderColor: '#7c6af7',
  },
  error: {
    color: '#FF4458',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#7c6af7',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  link: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    color: '#3d3d5c',
    fontSize: 14,
  },
  linkBold: {
    color: '#7c6af7',
    fontWeight: '600',
  },
  // Terms screen styles
  termsWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  termsTopBar: {
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#22223a',
  },
  backBtn: {},
  backBtnText: {
    color: '#7c6af7',
    fontSize: 15,
    fontWeight: '500',
  },
  termsTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  termsSubtitle: {
    color: '#3d3d5c',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  termsScroll: {
    flex: 1,
  },
  termsScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  termsSection: {
    marginBottom: 20,
  },
  termsSectionTitle: {
    color: '#9d8fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  termsSectionBody: {
    color: '#a0a0c0',
    fontSize: 13,
    lineHeight: 20,
  },
  termsBottomPad: {
    height: 16,
  },
  termsFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    borderTopWidth: 1,
    borderTopColor: '#22223a',
    backgroundColor: '#0d0d0d',
  },
  checkboxDivider: {
    height: 1,
    backgroundColor: '#22223a',
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3d3d5c',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#7c6af7',
    borderColor: '#7c6af7',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    color: '#a0a0c0',
    fontSize: 13,
    lineHeight: 20,
  },
  checkboxLabelBold: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
