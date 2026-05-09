# Interpark Ticket Queue Monitor - Chrome Extension

## Project Overview
- **Project Name**: Interpark Ticket Queue Monitor
- **Type**: Chrome Extension
- **Core Functionality**: Monitor Interpark ticket queue status and notify users when their turn arrives
- **Target Users**: Users purchasing tickets from Interpark's waiting queue system

## UI/UX Specification

### Layout Structure
- **Popup Window**: 320px width, auto height
- **Options Page**: 400px width, 500px height

### Visual Design
- **Color Palette**:
  - Primary: #2563EB (Blue)
  - Secondary: #64748B (Slate)
  - Success: #10B981 (Green)
  - Warning: #F59E0B (Amber)
  - Danger: #EF4444 (Red)
  - Background: #F8FAFC (Light gray)
  - Card Background: #FFFFFF
- **Typography**: System font stack, 14px base
- **Spacing**: 8px base unit

### Components
1. **Popup View**:
   - Status indicator (monitoring/stopped)
   - Current queue number display
   - Estimated wait count display
   - Booking rate percentage
   - Quick threshold input
   - Sound toggle button
   - Start/Stop monitoring button

2. **Options Page**:
   - Threshold input (number)
   - Bark webhook URL input
   - Sound notification toggle
   - Test notification button

## Functionality Specification

### Core Features
1. **Queue Monitoring**:
   - Detect queue number from page DOM
   - Detect estimated wait count
   - Detect booking rate percentage
   - Polling interval: 3 seconds

2. **Threshold Alert**:
   - User configurable threshold (default: 1000)
   - Trigger Bark webhook when queue number <= threshold

3. **Turn Alert (Queue = 0)**:
   - Detect when queue number becomes 0
   - Detect URL change to booking page (https://gpoticket.globalinterpark.com/Global/Play/Book/BookMain.asp)
   - Play continuous sound alert
   - Send Bark notification

4. **Bark Notification**:
   - Send push notification via webhook URL
   - Include current queue status

5. **Sound Alert**:
   - Play alert sound when turn arrives
   - Toggle on/off in settings

### User Interactions
- Click extension icon to open popup
- Configure threshold and webhook in options page
- Start/Stop monitoring from popup
- Toggle sound on/off

## Acceptance Criteria
1. Extension correctly identifies waiting page URL pattern
2. Queue number is correctly extracted from page
3. Threshold alert triggers at configured number
4. Sound plays when queue = 0 or booking page reached
5. Bark notification sent successfully
6. Settings persist across sessions