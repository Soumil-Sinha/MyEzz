/**
 * Location Screen (Home)
 * 
 * User enters pickup and drop locations.
 * Features:
 * - Neumorphic input cards
 * - Animated route indicator
 * - Continue button triggers search
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../theme';
import { searchProviders } from '../services/api';

const { width } = Dimensions.get('window');

export default function LocationScreen() {
    const router = useRouter();
    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const dotAnim1 = useRef(new Animated.Value(0)).current;
    const dotAnim2 = useRef(new Animated.Value(0)).current;
    const dotAnim3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entry animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        // Dot cascade animation
        const animateDots = () => {
            const createDotAnimation = (anim, delay) =>
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0.3,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ]);

            Animated.loop(
                Animated.parallel([
                    createDotAnimation(dotAnim1, 0),
                    createDotAnimation(dotAnim2, 150),
                    createDotAnimation(dotAnim3, 300),
                ])
            ).start();
        };

        animateDots();
    }, []);

    const handleSearch = async () => {
        if (!pickup.trim() || !drop.trim()) {
            setError('Please enter both pickup and drop locations');
            // Shake animation for error
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1.03, duration: 80, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
            ]).start();
            return;
        }

        setError('');
        setLoading(true);

        try {
            const result = await searchProviders(
                {
                    address: pickup,
                    gps: '28.6139,77.2090',
                    city: 'New Delhi',
                    state: 'Delhi',
                    pincode: '110001',
                },
                {
                    address: drop,
                    gps: '28.5355,77.3910',
                    city: 'Noida',
                    state: 'Uttar Pradesh',
                    pincode: '201301',
                }
            );

            // Navigate to loading screen with transaction ID
            router.push({
                pathname: '/loading',
                params: {
                    transactionId: result.transactionId,
                    pickup: pickup,
                    drop: drop,
                },
            });
        } catch (err) {
            setError(err.message || 'Failed to search. Is the server running?');
            setLoading(false);
        }
    };

    const isReady = pickup.trim().length > 0 && drop.trim().length > 0;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <View style={styles.logoIcon}>
                                <Text style={styles.logoEmoji}>📦</Text>
                            </View>
                            <View>
                                <Text style={styles.appName}>ONDC Logistics</Text>
                                <Text style={styles.appTagline}>Fast • Reliable • Open Network</Text>
                            </View>
                        </View>
                    </View>

                    {/* Title */}
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>Where are you{'\n'}sending today?</Text>
                        <Text style={styles.subtitle}>
                            Get instant quotes from verified logistics partners
                        </Text>
                    </View>

                    {/* Location Card */}
                    <Animated.View
                        style={[
                            styles.locationCard,
                            { transform: [{ scale: pulseAnim }] },
                        ]}
                    >
                        {/* Pickup Input */}
                        <View style={styles.inputRow}>
                            <View style={styles.inputIconContainer}>
                                <View style={[styles.inputDot, styles.pickupDot]} />
                            </View>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>PICKUP</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter pickup location"
                                    placeholderTextColor={theme.colors.textMuted}
                                    value={pickup}
                                    onChangeText={setPickup}
                                    returnKeyType="next"
                                />
                            </View>
                        </View>

                        {/* Route Indicator */}
                        <View style={styles.routeIndicator}>
                            <View style={styles.routeLine}>
                                <Animated.View style={[styles.routeDotSmall, { opacity: dotAnim1 }]} />
                                <Animated.View style={[styles.routeDotSmall, { opacity: dotAnim2 }]} />
                                <Animated.View style={[styles.routeDotSmall, { opacity: dotAnim3 }]} />
                            </View>
                        </View>

                        {/* Drop Input */}
                        <View style={styles.inputRow}>
                            <View style={styles.inputIconContainer}>
                                <View style={[styles.inputDot, styles.dropDot]} />
                            </View>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>DROP</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter drop location"
                                    placeholderTextColor={theme.colors.textMuted}
                                    value={drop}
                                    onChangeText={setDrop}
                                    returnKeyType="done"
                                    onSubmitEditing={handleSearch}
                                />
                            </View>
                        </View>
                    </Animated.View>

                    {/* Error */}
                    {error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>⚠️ {error}</Text>
                        </View>
                    ) : null}

                    {/* Continue Button */}
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            !isReady && styles.continueButtonDisabled,
                            loading && styles.continueButtonLoading,
                        ]}
                        onPress={handleSearch}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <Text style={styles.continueButtonText}>Searching...</Text>
                        ) : (
                            <>
                                <Text style={styles.continueButtonText}>Find Delivery Partners</Text>
                                <Text style={styles.continueButtonArrow}>→</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Powered by</Text>
                        <Text style={styles.footerBrand}>ONDC Open Network</Text>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: Platform.OS === 'android' ? 48 : 16,
    },
    header: {
        marginBottom: theme.spacing.xl,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadow.md,
    },
    logoEmoji: {
        fontSize: 22,
    },
    appName: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        letterSpacing: -0.3,
    },
    appTagline: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        marginTop: 1,
        letterSpacing: 0.5,
    },
    titleSection: {
        marginBottom: theme.spacing.xl,
    },
    title: {
        fontSize: theme.fontSize.hero,
        fontWeight: theme.fontWeight.extrabold,
        color: theme.colors.text,
        lineHeight: 42,
        letterSpacing: -0.8,
    },
    subtitle: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.sm,
        lineHeight: 22,
    },
    locationCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        ...theme.shadow.lg,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    inputIconContainer: {
        width: 32,
        alignItems: 'center',
    },
    inputDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    pickupDot: {
        backgroundColor: theme.colors.success,
        borderWidth: 3,
        borderColor: theme.colors.successLight,
    },
    dropDot: {
        backgroundColor: theme.colors.primary,
        borderWidth: 3,
        borderColor: '#FED7AA',
    },
    inputWrapper: {
        flex: 1,
    },
    inputLabel: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.textMuted,
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    textInput: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    routeIndicator: {
        paddingLeft: 16,
        paddingVertical: 4,
        height: 36,
        justifyContent: 'center',
    },
    routeLine: {
        width: 2,
        height: '100%',
        marginLeft: 6,
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 4,
    },
    routeDotSmall: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.textMuted,
    },
    errorContainer: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.errorLight,
        borderRadius: theme.borderRadius.md,
    },
    errorText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.error,
        textAlign: 'center',
    },
    continueButton: {
        marginTop: theme.spacing.xl,
        backgroundColor: theme.colors.primary,
        paddingVertical: 18,
        borderRadius: theme.borderRadius.lg,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        ...theme.shadow.md,
    },
    continueButtonDisabled: {
        backgroundColor: theme.colors.primaryLight,
    },
    continueButtonLoading: {
        backgroundColor: theme.colors.primaryDark,
    },
    continueButtonText: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.textOnPrimary,
        letterSpacing: -0.2,
    },
    continueButtonArrow: {
        fontSize: 20,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.textOnPrimary,
    },
    footer: {
        marginTop: 'auto',
        paddingBottom: theme.spacing.lg,
        alignItems: 'center',
        gap: 2,
    },
    footerText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
    },
    footerBrand: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.primary,
    },
});
