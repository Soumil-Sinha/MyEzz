/**
 * Loading Screen
 * 
 * Shows skeleton cards and a "Finding delivery options" message
 * while polling the BAP server for search results.
 * 
 * Auto-navigates to results screen when providers are found.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../theme';
import { getResults } from '../services/api';

const { width } = Dimensions.get('window');
const POLL_INTERVAL = 1500;
const MAX_POLLS = 20;

export default function LoadingScreen() {
    const router = useRouter();
    const { transactionId, pickup, drop } = useLocalSearchParams();
    const [status, setStatus] = useState('Connecting to ONDC network...');
    const [dots, setDots] = useState('');
    const pollCountRef = useRef(0);

    // Skeleton shimmer animation
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const fadeIn = useRef(new Animated.Value(0)).current;
    const truckAnim = useRef(new Animated.Value(-50)).current;

    useEffect(() => {
        // Fade in
        Animated.timing(fadeIn, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        // Shimmer loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Truck animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(truckAnim, {
                    toValue: width + 50,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(truckAnim, {
                    toValue: -50,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Dots animation
        const dotsInterval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
        }, 500);

        // Status message cycle
        const messages = [
            'Connecting to ONDC network',
            'Broadcasting search request',
            'Waiting for logistics providers',
            'Collecting delivery quotes',
            'Almost there',
        ];
        let msgIndex = 0;
        const msgInterval = setInterval(() => {
            msgIndex = (msgIndex + 1) % messages.length;
            setStatus(messages[msgIndex]);
        }, 2500);

        // Poll for results
        const pollInterval = setInterval(async () => {
            pollCountRef.current += 1;

            if (pollCountRef.current > MAX_POLLS) {
                clearInterval(pollInterval);
                clearInterval(dotsInterval);
                clearInterval(msgInterval);
                // Navigate to results anyway (may show empty state)
                router.replace({
                    pathname: '/results',
                    params: { transactionId, pickup, drop },
                });
                return;
            }

            try {
                const data = await getResults(transactionId);
                if (data.status === 'results_ready' && data.providers && data.providers.length > 0) {
                    clearInterval(pollInterval);
                    clearInterval(dotsInterval);
                    clearInterval(msgInterval);

                    // Slight delay for smooth transition
                    setTimeout(() => {
                        router.replace({
                            pathname: '/results',
                            params: { transactionId, pickup, drop },
                        });
                    }, 500);
                }
            } catch (err) {
                console.log('Polling...', err.message);
            }
        }, POLL_INTERVAL);

        return () => {
            clearInterval(pollInterval);
            clearInterval(dotsInterval);
            clearInterval(msgInterval);
        };
    }, []);

    const shimmerTranslate = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    const shimmerOpacity = shimmerAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.3, 0.7, 0.3],
    });

    const renderSkeletonCard = (index) => (
        <Animated.View
            key={index}
            style={[
                styles.skeletonCard,
                {
                    opacity: shimmerOpacity,
                },
            ]}
        >
            <View style={styles.skeletonRow}>
                <View style={styles.skeletonAvatar} />
                <View style={styles.skeletonContent}>
                    <View style={[styles.skeletonLine, { width: '60%' }]} />
                    <View style={[styles.skeletonLine, { width: '40%', height: 10 }]} />
                </View>
                <View style={styles.skeletonPrice} />
            </View>
            <View style={styles.skeletonFooter}>
                <View style={[styles.skeletonLine, { width: '30%', height: 8 }]} />
                <View style={[styles.skeletonLine, { width: '20%', height: 8 }]} />
            </View>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={[styles.content, { opacity: fadeIn }]}>
                {/* Route Summary */}
                <View style={styles.routeSummary}>
                    <View style={styles.routePoint}>
                        <View style={[styles.dot, styles.pickupDot]} />
                        <Text style={styles.routeText} numberOfLines={1}>
                            {pickup || 'Pickup'}
                        </Text>
                    </View>
                    <View style={styles.routeArrow}>
                        <Text style={styles.arrowText}>→</Text>
                    </View>
                    <View style={styles.routePoint}>
                        <View style={[styles.dot, styles.dropDot]} />
                        <Text style={styles.routeText} numberOfLines={1}>
                            {drop || 'Drop'}
                        </Text>
                    </View>
                </View>

                {/* Truck Animation */}
                <View style={styles.truckContainer}>
                    <Animated.Text
                        style={[
                            styles.truckEmoji,
                            { transform: [{ translateX: truckAnim }] },
                        ]}
                    >
                        🚚
                    </Animated.Text>
                    <View style={styles.road} />
                </View>

                {/* Status */}
                <View style={styles.statusContainer}>
                    <Text style={styles.statusTitle}>Finding delivery options{dots}</Text>
                    <Text style={styles.statusSubtitle}>{status}</Text>
                </View>

                {/* Skeleton Cards */}
                <View style={styles.skeletonContainer}>
                    {[0, 1, 2, 3].map(renderSkeletonCard)}
                </View>

                {/* Protocol Info */}
                <View style={styles.protocolInfo}>
                    <Text style={styles.protocolText}>
                        🔒 Beckn Protocol v1.2.0 • ONDC:LOG10
                    </Text>
                </View>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: Platform.OS === 'android' ? 48 : 16,
    },
    routeSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm + 4,
        borderRadius: theme.borderRadius.lg,
        ...theme.shadow.sm,
        marginBottom: theme.spacing.xl,
    },
    routePoint: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    pickupDot: {
        backgroundColor: theme.colors.success,
    },
    dropDot: {
        backgroundColor: theme.colors.primary,
    },
    routeText: {
        flex: 1,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text,
    },
    routeArrow: {
        paddingHorizontal: 8,
    },
    arrowText: {
        fontSize: 16,
        color: theme.colors.textMuted,
    },
    truckContainer: {
        height: 50,
        marginBottom: theme.spacing.lg,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    truckEmoji: {
        fontSize: 30,
        position: 'absolute',
        bottom: 8,
    },
    road: {
        height: 3,
        backgroundColor: theme.colors.border,
        borderRadius: 2,
    },
    statusContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    statusTitle: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    statusSubtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: 6,
        textAlign: 'center',
    },
    skeletonContainer: {
        gap: theme.spacing.md,
    },
    skeletonCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        ...theme.shadow.sm,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    skeletonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    skeletonAvatar: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: theme.colors.borderLight,
    },
    skeletonContent: {
        flex: 1,
        gap: 6,
    },
    skeletonLine: {
        height: 14,
        borderRadius: 4,
        backgroundColor: theme.colors.borderLight,
    },
    skeletonPrice: {
        width: 60,
        height: 24,
        borderRadius: 8,
        backgroundColor: theme.colors.borderLight,
    },
    skeletonFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    protocolInfo: {
        marginTop: theme.spacing.xl,
        alignItems: 'center',
    },
    protocolText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        letterSpacing: 0.3,
    },
});
