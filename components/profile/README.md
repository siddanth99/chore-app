# Profile Components

This directory contains components for the user profile feature.

## Components

### `ProfilePageView.tsx`
Main client component that renders the editable profile page for the signed-in user. Includes:
- Profile card with user information
- Rating summary
- Reviews list
- Quick links
- Edit profile modal trigger

### `ProfileCard.tsx`
Server component that displays user profile information including:
- Avatar (with fallback to initials)
- Name, email, role badge
- Bio, phone, location
- Skills (comma-separated chips)
- Hourly rate
- Member since date
- Link to public profile

### `RatingSummary.tsx`
Server component that displays:
- Average rating (out of 5)
- Star visualization
- Total review count

### `ReviewsList.tsx`
Server component that displays a list of reviews with:
- Reviewer name
- Chore title (linked)
- Star rating
- Comment text
- Date

### `QuickLinks.tsx`
Client component with navigation buttons:
- Go to Dashboard
- Browse Chores
- Notifications

### `EditProfileModal.tsx`
Client component modal for editing profile information. Includes:
- Profile picture upload (with preview)
- Name (required)
- Bio (textarea)
- Phone (with validation)
- Location
- Skills (comma-separated input)
- Hourly Rate (number input)
- Client-side validation
- Focus trap and keyboard navigation
- Accessibility features (ARIA labels, roles)

### `ProfilePublicView.tsx`
Server component for read-only public profile view used by `/profile/[id]`.

## API Endpoints to Implement

### 1. Update Profile
**Endpoint:** `PATCH /api/users/:id`

**Request Body:**
```json
{
  "name": "string",
  "bio": "string",
  "phone": "string",
  "baseLocation": "string",
  "skills": ["string"],
  "hourlyRate": number
}
```

**Location:** Add this endpoint in `web/app/api/users/[id]/route.ts`

### 2. Upload Avatar
**Endpoint:** `POST /api/users/:id/avatar`

**Request:** `multipart/form-data` with `avatar` file field

**Response:** Should return updated `avatarUrl`

**Location:** Add this endpoint in `web/app/api/users/[id]/avatar/route.ts`

## Database Schema Updates Needed

The following fields need to be added to the `User` model in `prisma/schema.prisma`:

```prisma
model User {
  // ... existing fields ...
  phone      String?
  skills     String?  // JSON array or comma-separated string
  hourlyRate Int?     // in rupees
}
```

After adding fields, run:
```bash
npx prisma migrate dev --name add_profile_fields
npx prisma generate
```

## Usage

### Opening Edit Profile Modal

The edit modal is opened from the `ProfilePageView` component when the user clicks the "Edit Profile" button. The modal handles all form state and validation client-side.

### Wiring Save Endpoint

In `ProfilePageView.tsx`, the `handleSave` function contains TODO comments showing where to:
1. Call `PATCH /api/users/:id` to update profile data
2. Call `POST /api/users/:id/avatar` if an avatar file was uploaded
3. Update local state with server response

### Analytics Integration

Add analytics tracking in `ProfilePageView.tsx` `handleSave` function:
```typescript
// TODO: Analytics: track profile update event
// Example:
// analytics.track('profile_updated', { userId, fields: ['name', 'bio'] })
```

## Styling

All components use Tailwind CSS with:
- Primary color: `#4F46E5`
- Dark mode support via `dark:` variants
- Consistent card styling matching landing page theme
- Responsive design

## Accessibility

- All interactive elements have ARIA labels
- Modal includes focus trap and keyboard navigation
- Form inputs have proper labels and error messages
- Color contrast meets WCAG standards

