/**
 * ONDC Logistics BAP - Shared Constants
 * Domain: ONDC:LOG10 (Logistics)
 * Core Version: 1.2.0
 */

const BECKN_CONSTANTS = {
  DOMAIN: 'ONDC:LOG10',
  CORE_VERSION: '1.2.0',
  COUNTRY: 'IND',
  CITY: 'std:011',
  TTL: 'PT30S',
  ACTION: {
    SEARCH: 'search',
    ON_SEARCH: 'on_search',
    SELECT: 'select',
    ON_SELECT: 'on_select',
    INIT: 'init',
    ON_INIT: 'on_init',
    CONFIRM: 'confirm',
    ON_CONFIRM: 'on_confirm',
    STATUS: 'status',
    ON_STATUS: 'on_status',
    CANCEL: 'cancel',
    ON_CANCEL: 'on_cancel',
    UPDATE: 'update',
    ON_UPDATE: 'on_update',
  },
};

const VEHICLE_CATEGORIES = {
  BIKE: 'Bike',
  AUTO: 'Auto',
  VAN: 'Van',
  TRUCK: 'Truck',
};

const FULFILLMENT_TYPES = {
  DELIVERY: 'Delivery',
  PICKUP: 'Pickup',
  RETURN: 'Return',
};

const ORDER_STATES = {
  CREATED: 'Created',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In-progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const MOCK_PROVIDERS = [
  {
    id: 'delhivery-logistics',
    descriptor: {
      name: 'Delhivery',
      short_desc: 'Express surface delivery',
      long_desc: 'Pan-India express logistics with real-time tracking',
      images: [{ url: 'https://cdn.ondc.org/delhivery-logo.png', size_type: 'sm' }],
    },
    category_id: 'Express Delivery',
    fulfillments: [
      {
        id: 'dlv-ful-1',
        type: 'Delivery',
        vehicle: { category: 'Bike' },
      },
    ],
    items: [
      {
        id: 'dlv-item-1',
        descriptor: {
          name: 'Express Delivery',
          code: 'P2P',
          short_desc: 'Point to point express delivery via Bike',
        },
        price: {
          currency: 'INR',
          value: '62.00',
        },
        category_id: 'Express Delivery',
        fulfillment_id: 'dlv-ful-1',
        time: {
          label: 'TAT',
          duration: 'PT45M',
          timestamp: '',
        },
        tags: [
          {
            code: 'rate_card',
            list: [
              { code: 'base_distance', value: '5' },
              { code: 'base_price', value: '50.00' },
              { code: 'per_km_charge', value: '4.00' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'shadowfax-logistics',
    descriptor: {
      name: 'Shadowfax',
      short_desc: 'Hyperlocal delivery network',
      long_desc: 'On-demand hyperlocal logistics with fleet management',
      images: [{ url: 'https://cdn.ondc.org/shadowfax-logo.png', size_type: 'sm' }],
    },
    category_id: 'Express Delivery',
    fulfillments: [
      {
        id: 'sfx-ful-1',
        type: 'Delivery',
        vehicle: { category: 'Bike' },
      },
    ],
    items: [
      {
        id: 'sfx-item-1',
        descriptor: {
          name: 'Standard Delivery',
          code: 'P2P',
          short_desc: 'Point to point delivery via Bike',
        },
        price: {
          currency: 'INR',
          value: '68.00',
        },
        category_id: 'Express Delivery',
        fulfillment_id: 'sfx-ful-1',
        time: {
          label: 'TAT',
          duration: 'PT42M',
          timestamp: '',
        },
        tags: [
          {
            code: 'rate_card',
            list: [
              { code: 'base_distance', value: '5' },
              { code: 'base_price', value: '55.00' },
              { code: 'per_km_charge', value: '4.50' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'porter-logistics',
    descriptor: {
      name: 'Porter',
      short_desc: 'Intra-city tempo logistics',
      long_desc: 'Reliable intra-city logistics with diverse fleet options',
      images: [{ url: 'https://cdn.ondc.org/porter-logo.png', size_type: 'sm' }],
    },
    category_id: 'Express Delivery',
    fulfillments: [
      {
        id: 'ptr-ful-1',
        type: 'Delivery',
        vehicle: { category: 'Van' },
      },
    ],
    items: [
      {
        id: 'ptr-item-1',
        descriptor: {
          name: 'Van Delivery',
          code: 'P2P',
          short_desc: 'Point to point delivery via Van',
        },
        price: {
          currency: 'INR',
          value: '120.00',
        },
        category_id: 'Express Delivery',
        fulfillment_id: 'ptr-ful-1',
        time: {
          label: 'TAT',
          duration: 'PT30M',
          timestamp: '',
        },
        tags: [
          {
            code: 'rate_card',
            list: [
              { code: 'base_distance', value: '5' },
              { code: 'base_price', value: '90.00' },
              { code: 'per_km_charge', value: '10.00' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'borzo-logistics',
    descriptor: {
      name: 'Borzo',
      short_desc: 'Same day courier service',
      long_desc: 'Same-day and next-day delivery solutions for businesses',
      images: [{ url: 'https://cdn.ondc.org/borzo-logo.png', size_type: 'sm' }],
    },
    category_id: 'Express Delivery',
    fulfillments: [
      {
        id: 'brz-ful-1',
        type: 'Delivery',
        vehicle: { category: 'Auto' },
      },
    ],
    items: [
      {
        id: 'brz-item-1',
        descriptor: {
          name: 'Auto Delivery',
          code: 'P2P',
          short_desc: 'Point to point delivery via Auto',
        },
        price: {
          currency: 'INR',
          value: '95.00',
        },
        category_id: 'Express Delivery',
        fulfillment_id: 'brz-ful-1',
        time: {
          label: 'TAT',
          duration: 'PT38M',
          timestamp: '',
        },
        tags: [
          {
            code: 'rate_card',
            list: [
              { code: 'base_distance', value: '5' },
              { code: 'base_price', value: '70.00' },
              { code: 'per_km_charge', value: '8.00' },
            ],
          },
        ],
      },
    ],
  },
];

module.exports = {
  BECKN_CONSTANTS,
  VEHICLE_CATEGORIES,
  FULFILLMENT_TYPES,
  ORDER_STATES,
  MOCK_PROVIDERS,
};
