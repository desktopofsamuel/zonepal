# Time Zone Converter Application PRD

## Overview
A web application that allows users to easily convert times across different time zones with an intuitive interface and comprehensive location search capabilities.

## Tech Stack
- NextJS 15
- TailwindCSS
- Shadcn UI
- React
- date-fns & date-fns-tz for timezone handling

## Current Features

### Interface Components
#### Time Zone Cards
- Clean card layout for each timezone
- Displays:
  - City/Location name
  - Region information
  - Current time in large format
  - Timezone abbreviation and offset
  - Current date

#### Timeline Component
- Visual time selection bar with gradient background
- Marker indicators every 2 hours
- Time labels every 4 hours
- Draggable handle for time selection
- Border for improved visual affordance
- Support for both 12-hour and 24-hour time formats

#### Search Interface
- Combobox-style search input
- Dropdown results with timezone information
- Shows timezone offset for each result
- Clear button to reset search

### Functional Features
#### Timezone Management
- Support for multiple timezone displays
- Real-time synchronization across all timezones
- Automatic timezone offset calculations
- UTC-based time storage for consistency
- Timezone conversion using IANA timezone database
- URL-based state management using query parameters (e.g., `/?z=Asia/Hong_Kong-to-America/New_York`)

#### Search Capabilities
- Search by timezone name
- Search by city name
- Search by region
- Filtering out already selected timezones
- Support for IANA timezone identifiers

#### Testing Case for Search Function
1. When i type "New ", new york and new salem should be returned
2. When i type "USA" or "United States" all timezones in the United States should be returned

### Interaction Features
#### Timeline Interaction
- Click anywhere on timeline to set time
- Drag handle to adjust time
- Real-time updates across all timezone cards
- Smooth dragging experience
- Position-to-time conversion respecting timezone offsets

#### Timezone Management
- Add new timezones via search
- Remove timezones with hover-reveal delete button
- Sort timezones by offset
- Preserve timezone selection in session

### Data Management
#### Time Handling
- UTC-based time storage
- Proper timezone offset calculations
- Consistent time synchronization across components
- Support for both local and UTC time representations

#### Timezone Conversion Implementation
- Timeline position to time conversion:
  - Position (0-100%) maps to 24-hour time (0-24 hours)
  - Uses Intl.DateTimeFormat for accurate timezone offset detection
  - Parses GMT offset strings to handle hours and minutes separately
  - Adjusts UTC time based on timezone-specific offsets
- Time to position conversion:
  - Converts UTC time to target timezone using date-fns-tz
  - Calculates position based on local hours in timezone
  - Maintains consistency across different timezone displays
- Error handling:
  - Graceful fallback to selected date on conversion errors
  - Logging of conversion steps for debugging
  - Validation of position and time values

#### State Management
- React state for UI components
- Timezone data caching
- Efficient updates without unnecessary rerenders
- Proper cleanup of event listeners

## Planned Features

### Interface Improvements
- Visual indicators for day changes
- DST period indicators
- Improved mobile responsiveness
- Keyboard accessibility

### Functional Additions
- Route parameter support for sharing
- Local storage for preferences
- Recent search history
- Custom timezone labels

### Technical Enhancements
- Performance optimizations
- Bundle size optimization
- Error boundary implementation
- Loading states

## Success Metrics
- User engagement time
- Search accuracy rate
- Conversion accuracy
- User retention rate
- Feature usage statistics