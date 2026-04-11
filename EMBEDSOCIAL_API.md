# EmbedSocial API Documentation

## Base URL
`https://embedsocial.com/app/api`

## Authentication
Requires API Key in header: `Authorization: Bearer {api_key}`

---

## Listings API

### GET /rest/v1/listings
Retrieves the collection of Listings

**Response Schema:**
```json
[
  {
    "id": "string",
    "googleId": "string",
    "name": "string",
    "storeCode": "string",
    "url": "string",
    "isVerified": true,
    "isDisabled": true,
    "isSuspended": true,
    "phoneNumber": "string",
    "address": "string",
    "websiteUrl": "string",
    "totalReviews": 0,
    "averageRating": 0,
    "lastReviewOn": "string",
    "lastReplyOn": "string"
  }
]
```

**Note:** Does NOT return `description`, `openingHours`, or `category` fields.

---

### GET /rest/v1/listings/{id}
Retrieves a specific Listing by ID

**Response Schema:** Same as GET /rest/v1/listings

---

### PATCH /rest/v1/listings/{id}
Updates a specific Listing by ID

**Request Body:**
```json
{
  "name": "Coffee shop sample",
  "websiteUrl": "https://samplecoffeeshop.com/",
  "phoneNumber": "4444444444",
  "description": "Sample description",
  "address": {
    "streetLines": ["Sample St 1"],
    "city": "Skopje",
    "country": "MK"
  },
  "openingHours": [
    {
      "openDay": "SATURDAY",
      "openTime": { "hours": 0, "minutes": 0, "seconds": 0 },
      "closeDay": "SATURDAY",
      "closeTime": { "hours": 16, "minutes": 0, "seconds": 0 }
    }
  ],
  "specialHours": [],
  "socialMediaLinks": [
    { "name": "Instagram", "value": "https://..." }
  ]
}
```

---

## Items (Reviews) API

### GET /rest/v1/items
Retrieves the collection of Items (reviews)

**Parameters:**
- `page` (integer, default: 1)
- `pageSize` (integer, default: 10)
- `sourceId` (string, comma-separated for multiple)
- `sort` (string, e.g., "-originalCreatedOn,-id")

**Response Schema:**
```json
[
  {
    "id": "string",
    "authorName": "string",
    "rating": 0,
    "captionText": "string",
    "sourceName": "string",
    "sourceAddress": "string",
    "sourceLink": "string",
    "sourceId": "string",
    "reviewLink": "string",
    "originalCreatedOn": "string",
    "replies": ["string"]
  }
]
```

---

### POST /rest/v1/items/{id}/replies
Create a reply for a review item

**Request Body:**
```json
{
  "comment": "Thank you for your review!"
}
```

---

## Metrics APIs

### GET /rest/v1/listing_metrics
Retrieves daily source metrics summarized data

**Parameters:**
- `startDate` (string, required, DD-MM-YYYY format)
- `endDate` (string, required, DD-MM-YYYY format)
- `sourceId` (string, optional)
- `page` (integer, default: 1)
- `pageSize` (integer, default: 10)

**Response Schema:**
```json
{
  "dateRange": {
    "startDate": "2024-08-25",
    "endDate": "2024-08-24"
  },
  "listings": [
    {
      "sourceId": "string",
      "businessName": "string",
      "address": "string",
      "googleMapsDesktop": 0,
      "googleMapsMobile": 0,
      "googleSearchDesktop": 0,
      "googleSearchMobile": 0,
      "messages": 0,
      "directions": 0,
      "callClicks": 0,
      "websiteClicks": 0,
      "bookings": 0,
      "foodOrders": 0,
      "foodMenuClicks": 0,
      "numPublishedPosts": 0,
      "avgPostingTime": 0.1,
      "avgReviewResponseTime": 0,
      "reviewResponsePercentage": 0.1
    }
  ]
}
```

---

### GET /rest/v1/listing_item_metrics
Retrieves reviews metrics summarized data

**Parameters:**
- `startDate` (string, required, DD-MM-YYYY format)
- `endDate` (string, required, DD-MM-YYYY format)
- `sourceId` (string, optional)

**Response Schema:**
```json
{
  "dateRange": {
    "startDate": "2024-08-25",
    "endDate": "2024-08-24"
  },
  "listings": [
    {
      "sourceId": "string",
      "businessName": "string",
      "address": "string",
      "numberOfReviews": 0,
      "averageRating": 0.1,
      "numberFiveStarReviews": 0,
      "numberFourStarReviews": 0,
      "numberThreeStarReviews": 0,
      "numberTwoStarReviews": 0,
      "numberOneStarReviews": 0,
      "numberReplies": 0,
      "latestReviewOn": "string",
      "positiveReviews": 0,
      "neutralReviews": 0,
      "negativeReviews": 0,
      "numberOfReviewsYesterday": 0,
      "numberOfReviewsThisWeek": 0,
      "numberOfReviewsThisMonth": 0,
      "numberOfReviewsThisYear": 0
    }
  ]
}
```

---

## Content Publishing API

### POST /rest/v1/content_publishing_media
Publish or schedule content publishing media posts

**Request Body:**
```json
{
  "type": "update",
  "sourceIds": ["string"],
  "captionText": "string",
  "ctaType": "book",
  "ctaUrl": "https://example.com/",
  "scheduledOn": "2026-04-11T19:50:19.960Z",
  "imageUrls": ["https://example.com/"],
  "title": "string"
}
```

---

## Notes

1. **Listings API does NOT return:** `description`, `openingHours`, `category`
   - These fields need to be fetched via other means or the API limitation needs to be addressed

2. **For Review Trends:** Use `/rest/v1/listing_item_metrics` to get:
   - `numberOfReviewsThisWeek`
   - `numberOfReviewsThisMonth`
   - `numberOfReviewsThisYear`
   - `positiveReviews`, `neutralReviews`, `negativeReviews`
   - Star distribution: `numberFiveStarReviews` through `numberOneStarReviews`
