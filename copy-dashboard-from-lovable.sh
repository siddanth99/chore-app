#!/usr/bin/env bash
set -e

# =============================================================================
# Dashboard UI Migration Script
# Copies Lovable dashboard UI components to Main Chore App repo
# =============================================================================

LOVABLE_REPO="/Users/venkatasudhamacherla/choreflow-ui"
MAIN_REPO="/Users/venkatasudhamacherla/projects/chore-app/chore-app"

echo "🚀 Starting Dashboard UI Migration..."
echo "   Source: $LOVABLE_REPO"
echo "   Target: $MAIN_REPO"
echo ""

# -----------------------------------------------------------------------------
# STEP 1: Backup existing dashboard UI files
# -----------------------------------------------------------------------------
echo "📦 Creating backup of existing dashboard UI files..."

BACKUP_DIR="$MAIN_REPO/.dashboard-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR/components/dashboard"
mkdir -p "$BACKUP_DIR/app/dashboard"

# Backup existing files (if they exist)
[ -f "$MAIN_REPO/app/dashboard/dashboard-client.tsx" ] && cp "$MAIN_REPO/app/dashboard/dashboard-client.tsx" "$BACKUP_DIR/app/dashboard/"
[ -f "$MAIN_REPO/components/dashboard/DashboardStatCard.tsx" ] && cp "$MAIN_REPO/components/dashboard/DashboardStatCard.tsx" "$BACKUP_DIR/components/dashboard/"
[ -f "$MAIN_REPO/components/dashboard/DashboardSection.tsx" ] && cp "$MAIN_REPO/components/dashboard/DashboardSection.tsx" "$BACKUP_DIR/components/dashboard/"
[ -f "$MAIN_REPO/components/dashboard/DashboardChoreCard.tsx" ] && cp "$MAIN_REPO/components/dashboard/DashboardChoreCard.tsx" "$BACKUP_DIR/components/dashboard/"

echo "   ✅ Backup created at: $BACKUP_DIR"
echo ""

# -----------------------------------------------------------------------------
# STEP 2: Ensure target directories exist
# -----------------------------------------------------------------------------
echo "📁 Ensuring target directories exist..."
mkdir -p "$MAIN_REPO/components/dashboard"
echo "   ✅ Directories ready"
echo ""

# -----------------------------------------------------------------------------
# STEP 3: Copy NEW Lovable dashboard components
# These are NEW components that don't exist in main repo yet
# -----------------------------------------------------------------------------
echo "📋 Copying NEW Lovable dashboard components..."

# StatCard (replaces DashboardStatCard)
cp "$LOVABLE_REPO/src/components/dashboard/StatCard.tsx" "$MAIN_REPO/components/dashboard/StatCard.tsx"
echo "   ✅ StatCard.tsx"

# SectionHeader (replaces DashboardSection partially)
cp "$LOVABLE_REPO/src/components/dashboard/SectionHeader.tsx" "$MAIN_REPO/components/dashboard/SectionHeader.tsx"
echo "   ✅ SectionHeader.tsx"

# ApplicationCard (NEW - for worker applications)
cp "$LOVABLE_REPO/src/components/dashboard/ApplicationCard.tsx" "$MAIN_REPO/components/dashboard/ApplicationCard.tsx"
echo "   ✅ ApplicationCard.tsx"

# AssignedCard (NEW - for assigned tasks with progress)
cp "$LOVABLE_REPO/src/components/dashboard/AssignedCard.tsx" "$MAIN_REPO/components/dashboard/AssignedCard.tsx"
echo "   ✅ AssignedCard.tsx"

# QuickActions (NEW - quick action buttons)
cp "$LOVABLE_REPO/src/components/dashboard/QuickActions.tsx" "$MAIN_REPO/components/dashboard/QuickActions.tsx"
echo "   ✅ QuickActions.tsx"

# NotificationsSummary (NEW - notifications sidebar)
cp "$LOVABLE_REPO/src/components/dashboard/NotificationsSummary.tsx" "$MAIN_REPO/components/dashboard/NotificationsSummary.tsx"
echo "   ✅ NotificationsSummary.tsx"

# DashboardChoreCard (NEW styled version - will need adaptation)
cp "$LOVABLE_REPO/src/components/dashboard/DashboardChoreCard.tsx" "$MAIN_REPO/components/dashboard/LovableDashboardChoreCard.tsx"
echo "   ✅ LovableDashboardChoreCard.tsx (needs adaptation)"

echo ""

# -----------------------------------------------------------------------------
# STEP 4: Copy the Lovable DashboardPage as a reference
# This will NOT replace the existing page.tsx (server component)
# -----------------------------------------------------------------------------
echo "📋 Copying Lovable DashboardPage as reference..."
cp "$LOVABLE_REPO/src/pages/DashboardPage.tsx" "$MAIN_REPO/components/dashboard/LovableDashboardPage.tsx"
echo "   ✅ LovableDashboardPage.tsx (reference only - needs integration)"
echo ""

# -----------------------------------------------------------------------------
# STEP 5: Create the new component index
# -----------------------------------------------------------------------------
echo "📋 Creating component index..."
cat > "$MAIN_REPO/components/dashboard/index.ts" << 'EOF'
// Dashboard UI Components (from Lovable)
export { SectionHeader } from './SectionHeader';
export { StatCard } from './StatCard';
export { ApplicationCard } from './ApplicationCard';
export { AssignedCard } from './AssignedCard';
export { QuickActions } from './QuickActions';
export { NotificationsSummary } from './NotificationsSummary';

// Legacy components (still used by dashboard-client.tsx)
export { default as DashboardStatCard } from './DashboardStatCard';
export { default as DashboardSection } from './DashboardSection';
export { default as DashboardChoreCard } from './DashboardChoreCard';

// Lovable reference components (need integration)
// export { DashboardChoreCard as LovableDashboardChoreCard } from './LovableDashboardChoreCard';
EOF
echo "   ✅ index.ts created"
echo ""

# -----------------------------------------------------------------------------
# STEP 6: Summary
# -----------------------------------------------------------------------------
echo "=============================================="
echo "✅ Dashboard UI copied safely!"
echo "=============================================="
echo ""
echo "📁 Files copied to $MAIN_REPO/components/dashboard/:"
echo "   - StatCard.tsx (new)"
echo "   - SectionHeader.tsx (new)"
echo "   - ApplicationCard.tsx (new)"
echo "   - AssignedCard.tsx (new)"
echo "   - QuickActions.tsx (new)"
echo "   - NotificationsSummary.tsx (new)"
echo "   - LovableDashboardChoreCard.tsx (reference)"
echo "   - LovableDashboardPage.tsx (reference)"
echo "   - index.ts (updated)"
echo ""
echo "🔒 Files NOT modified:"
echo "   - app/dashboard/page.tsx (server component with auth)"
echo "   - app/dashboard/dashboard-client.tsx (current client UI)"
echo "   - app/dashboard/logout-button.tsx"
echo "   - server/api/dashboard.ts (Prisma queries)"
echo "   - app/layout.tsx"
echo "   - globals.css"
echo ""
echo "📋 NEXT STEPS:"
echo "   1. Review LovableDashboardPage.tsx for UI patterns"
echo "   2. Integrate new components into dashboard-client.tsx"
echo "   3. Wire StatCard/ApplicationCard/etc to real data from server/api/dashboard.ts"
echo "   4. Test role-based dashboard views (CUSTOMER vs WORKER)"
echo ""
echo "💾 Backup location: $BACKUP_DIR"
echo ""

