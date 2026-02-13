/**
 * Results Screen
 * 
 * Displays logistics provider cards with:
 * - Provider name, price, ETA
 * - "Cheapest" badge on lowest price
 * - Vehicle category filter chips (All / Bike / Auto / Van)
 * - Neumorphic card design
 * - Animated entry
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    RefreshControl,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../theme';
import { getResults, selectProvider } from '../services/api';

const { width } = Dimensions.get('window');

const VEHICLE_ICONS = {
    Bike: '🏍️',
    Auto: '🛺',
    Van: '🚐',
    Truck: '🚛',
};

const VEHICLE_COLORS = {
    Bike: '#22C55E',
    Auto: '#F59E0B',
    Van: '#3B82F6',
    Truck: '#8B5CF6',
};

const FILTERS = ['All', 'Bike', 'Auto', 'Van'];

export default function ResultsScreen() {
    const router = useRouter();
    const { transactionId, pickup, drop } = useLocalSearchParams();
    const [providers, setProviders] = useState([]);
    const [activeFilter, setActiveFilter] = useState('All');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Animations
    const fadeIn = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-20)).current;
    const cardAnims = useRef([...Array(8)].map(() => new Animated.Value(0))).current;

    const fetchResults = useCallback(async () => {
        try {
            const data = await getResults(transactionId);
            if (data.providers) {
                setProviders(data.providers);
            }
        } catch (err) {
            console.log('Fetch error:', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [transactionId]);

    useEffect(() => {
        fetchResults();

        // Entry animations
        Animated.parallel([
            Animated.timing(fadeIn, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(headerSlide, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    useEffect(() => {
        // Stagger card animations when providers change
        if (providers.length > 0) {
            const animations = providers.map((_, i) =>
                Animated.timing(cardAnims[i] || new Animated.Value(0), {
                    toValue: 1,
                    duration: 400,
                    delay: i * 100,
                    useNativeDriver: true,
                })
            );
            Animated.stagger(80, animations).start();
        }
    }, [providers]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchResults();
    }, []);

    const filteredProviders = activeFilter === 'All'
        ? providers
        : providers.filter((p) => p.vehicleCategory === activeFilter);

    const handleSelect = async (provider) => {
        setSelectedId(provider.id);
        try {
            await selectProvider({
                transactionId,
                providerId: provider.id,
                itemId: provider.itemId,
                fulfillmentId: provider.fulfillmentId,
                bppId: provider.bppId,
                bppUri: provider.bppUri,
            });
        } catch (err) {
            console.log('Select error:', err.message);
        }
    };

    const renderFilterChip = (filter) => {
        const isActive = activeFilter === filter;
        return (
            <TouchableOpacity
                key={filter}
                style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.7}
            >
                {filter !== 'All' && (
                    <Text style={styles.filterIcon}>{VEHICLE_ICONS[filter]}</Text>
                )}
                <Text
                    style={[
                        styles.filterText,
                        isActive && styles.filterTextActive,
                    ]}
                >
                    {filter}
                </Text>
                {filter !== 'All' && (
                    <View
                        style={[
                            styles.filterCount,
                            isActive && styles.filterCountActive,
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterCountText,
                                isActive && styles.filterCountTextActive,
                            ]}
                        >
                            {providers.filter((p) =>
                                filter === 'All' ? true : p.vehicleCategory === filter
                            ).length}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderProviderCard = (provider, index) => {
        const isSelected = selectedId === provider.id;
        const animValue = cardAnims[index] || new Animated.Value(1);

        return (
            <Animated.View
                key={`${provider.id}-${provider.itemId}`}
                style={[
                    styles.providerCard,
                    isSelected && styles.providerCardSelected,
                    {
                        opacity: animValue,
                        transform: [
                            {
                                translateY: animValue.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [30, 0],
                                }),
                            },
                            {
                                scale: animValue.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.95, 1],
                                }),
                            },
                        ],
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.providerCardInner}
                    onPress={() => handleSelect(provider)}
                    activeOpacity={0.7}
                >
                    {/* Cheapest Badge */}
                    {provider.isCheapest && (
                        <View style={styles.cheapestBadge}>
                            <Text style={styles.cheapestText}>⚡ CHEAPEST</Text>
                        </View>
                    )}

                    <View style={styles.providerRow}>
                        {/* Vehicle Icon */}
                        <View
                            style={[
                                styles.vehicleIconContainer,
                                {
                                    backgroundColor:
                                        (VEHICLE_COLORS[provider.vehicleCategory] || theme.colors.primary) + '15',
                                },
                            ]}
                        >
                            <Text style={styles.vehicleIcon}>
                                {VEHICLE_ICONS[provider.vehicleCategory] || '📦'}
                            </Text>
                        </View>

                        {/* Provider Info */}
                        <View style={styles.providerInfo}>
                            <Text style={styles.providerName}>{provider.name}</Text>
                            <Text style={styles.providerDesc}>{provider.shortDesc}</Text>
                            <View style={styles.providerMeta}>
                                <View style={styles.metaItem}>
                                    <Text style={styles.metaIcon}>⏱️</Text>
                                    <Text style={styles.metaText}>{provider.etaMinutes} min</Text>
                                </View>
                                <View style={styles.metaDot} />
                                <View style={styles.metaItem}>
                                    <Text style={styles.metaIcon}>
                                        {VEHICLE_ICONS[provider.vehicleCategory] || '📦'}
                                    </Text>
                                    <Text style={styles.metaText}>{provider.vehicleCategory}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Price */}
                        <View style={styles.priceContainer}>
                            <Text style={styles.priceCurrency}>₹</Text>
                            <Text style={styles.priceValue}>{Math.round(provider.price)}</Text>
                        </View>
                    </View>

                    {/* Select Indicator */}
                    {isSelected && (
                        <View style={styles.selectedIndicator}>
                            <Text style={styles.selectedText}>✓ Selected</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View
                style={[
                    styles.header,
                    {
                        opacity: fadeIn,
                        transform: [{ translateY: headerSlide }],
                    },
                ]}
            >
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>

                {/* Route Summary */}
                <View style={styles.routeSummary}>
                    <View style={styles.routeRow}>
                        <View style={[styles.routeDot, styles.pickupDot]} />
                        <Text style={styles.routeLabel} numberOfLines={1}>
                            {pickup || 'Pickup'}
                        </Text>
                    </View>
                    <Text style={styles.routeArrow}>→</Text>
                    <View style={styles.routeRow}>
                        <View style={[styles.routeDot, styles.dropDot]} />
                        <Text style={styles.routeLabel} numberOfLines={1}>
                            {drop || 'Drop'}
                        </Text>
                    </View>
                </View>
            </Animated.View>

            {/* Results Count */}
            <Animated.View style={[styles.resultsHeader, { opacity: fadeIn }]}>
                <Text style={styles.resultsTitle}>
                    {filteredProviders.length} Delivery Partner
                    {filteredProviders.length !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.resultsSubtitle}>
                    Sorted by best price
                </Text>
            </Animated.View>

            {/* Filter Chips */}
            <Animated.View style={[styles.filterContainer, { opacity: fadeIn }]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                >
                    {FILTERS.map(renderFilterChip)}
                </ScrollView>
            </Animated.View>

            {/* Provider Cards */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                    />
                }
            >
                {filteredProviders.length === 0 && !loading ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🔍</Text>
                        <Text style={styles.emptyTitle}>No providers found</Text>
                        <Text style={styles.emptySubtitle}>
                            {activeFilter !== 'All'
                                ? `No ${activeFilter} delivery options available. Try "All" filter.`
                                : 'Please try again or modify your search.'}
                        </Text>
                    </View>
                ) : (
                    filteredProviders.map((provider, index) =>
                        renderProviderCard(provider, index)
                    )
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Prices include all taxes and delivery charges
                    </Text>
                    <Text style={styles.footerProtocol}>
                        ONDC:LOG10 • Beckn v1.2.0 • Transaction ID: {transactionId?.substring(0, 8)}...
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: Platform.OS === 'android' ? 48 : 16,
        paddingBottom: theme.spacing.md,
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadow.sm,
    },
    backArrow: {
        fontSize: 20,
        color: theme.colors.text,
        fontWeight: theme.fontWeight.bold,
    },
    routeSummary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        ...theme.shadow.sm,
        gap: 6,
    },
    routeRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    routeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    pickupDot: {
        backgroundColor: theme.colors.success,
    },
    dropDot: {
        backgroundColor: theme.colors.primary,
    },
    routeLabel: {
        flex: 1,
        fontSize: theme.fontSize.sm,
        color: theme.colors.text,
        fontWeight: theme.fontWeight.medium,
    },
    routeArrow: {
        fontSize: 14,
        color: theme.colors.textMuted,
        marginHorizontal: 2,
    },
    resultsHeader: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },
    resultsTitle: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        letterSpacing: -0.3,
    },
    resultsSubtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    filterContainer: {
        marginBottom: theme.spacing.md,
    },
    filterScroll: {
        paddingHorizontal: theme.spacing.lg,
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        gap: 6,
    },
    filterChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    filterIcon: {
        fontSize: 14,
    },
    filterText: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
    },
    filterTextActive: {
        color: theme.colors.textOnPrimary,
    },
    filterCount: {
        backgroundColor: theme.colors.borderLight,
        paddingHorizontal: 7,
        paddingVertical: 1,
        borderRadius: 10,
    },
    filterCountActive: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    filterCountText: {
        fontSize: 11,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.textSecondary,
    },
    filterCountTextActive: {
        color: theme.colors.textOnPrimary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.xxl,
        gap: theme.spacing.md,
    },
    providerCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        ...theme.shadow.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        overflow: 'hidden',
    },
    providerCardSelected: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
    },
    providerCardInner: {
        padding: theme.spacing.md + 2,
    },
    cheapestBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: theme.colors.success,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderBottomLeftRadius: 12,
        borderTopRightRadius: theme.borderRadius.xl - 1,
    },
    cheapestText: {
        fontSize: 10,
        fontWeight: theme.fontWeight.bold,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    providerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    vehicleIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    vehicleIcon: {
        fontSize: 24,
    },
    providerInfo: {
        flex: 1,
    },
    providerName: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        letterSpacing: -0.2,
    },
    providerDesc: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    providerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 6,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    metaIcon: {
        fontSize: 12,
    },
    metaText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        fontWeight: theme.fontWeight.medium,
    },
    metaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: theme.colors.textMuted,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 1,
    },
    priceCurrency: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.primary,
        marginTop: 2,
    },
    priceValue: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.extrabold,
        color: theme.colors.primary,
        letterSpacing: -1,
    },
    selectedIndicator: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        alignItems: 'center',
    },
    selectedText: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.success,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xxl,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: theme.spacing.md,
    },
    emptyTitle: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    emptySubtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xxl,
        lineHeight: 20,
    },
    footer: {
        alignItems: 'center',
        paddingTop: theme.spacing.xl,
        paddingBottom: theme.spacing.md,
        gap: 4,
    },
    footerText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
    },
    footerProtocol: {
        fontSize: 10,
        color: theme.colors.textMuted,
        letterSpacing: 0.3,
    },
});
