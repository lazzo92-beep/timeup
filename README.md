# TimeUp

**A lightweight time tracking Power-Up for Trello**

TimeUp enables seamless time tracking directly within your Trello workflow. Track time spent on individual cards, set estimates, and monitor progress with checklist-level granularity—all without leaving your board.

---

## Features

### Card-Level Time Tracking

- **One-click timer**: Start and stop timers directly from the card with a single button
- **Persistent tracking**: Timer state is preserved across sessions and devices
- **Automatic entries**: Each timing session is recorded with start time and duration
- **Member attribution**: Track who recorded each time entry

### Checklist Integration

- **Item-level timers**: Track time on individual checklist items
- **Automatic estimates**: Estimates calculated from checklist item estimates
- **Progress visualization**: Progress bar shows time spent vs estimated

### Time Estimates

- **Manual estimates**: Set time estimates in flexible formats (2h 30m, 1:30:00)
- **Checklist-based estimates**: Auto-calculate from checklist item estimates
- **Visual progress**: Color-coded progress bar (green → yellow → red)

### Visual Indicators

- **Card badges**: Display total time and running status on card fronts
- **Detail badges**: Show accumulated time in card backs
- **Color-coded states**: Green for running, neutral for stopped

### Board Reporting

- **Board report button**: Open a report from the Trello board header
- **Card totals**: Review tracked time, estimates, and over/under budget by card
- **CSV export**: Download a billing-friendly spreadsheet source

---

## Installation

### From Trello Power-Up Directory

1. Open a Trello board
2. Click **Power-Ups** in the board menu
3. Search for **TimeUp**
4. Click **Add** to enable

### Custom Installation (Self-Hosted)

1. Clone this repository
2. Host the files on any static hosting service (GitHub Pages, Netlify, etc.)
3. Register a new Power-Up at [trello.com/power-ups/admin](https://trello.com/power-ups/admin)
4. Set the iframe connector URL to your hosted `index.html`
5. Copy your Trello Power-Up API key into `src/config/AppConfig.js`
6. Configure the following capabilities:
   - Board buttons
   - Card badges
   - Card detail badges
   - Card back section
7. Add the private/custom Power-Up to your Trello board

---

## Usage

### Tracking Time

1. Open any card on your board
2. Locate the **Time Tracker** section in the card
3. Click **Start** to begin tracking
4. Click **Stop** when finished—the entry is automatically saved

### Setting Estimates

1. In the card's Time Tracker section, find the estimate input
2. Enter time in formats like `2h 30m`, `1:30:00`, or `90m`
3. Click **Set** to save the estimate
4. Progress bar will show time spent vs estimate

### Checklist Time Tracking

1. Authorize Trello access when prompted (read-only)
2. Click on any checklist item's timer icon
3. Track time per checklist item individually
4. Item estimates contribute to card total estimate

### Reporting

1. Open your Trello board
2. Click **Time Report** in the board header
3. Review totals by visible card
4. Click **Export CSV** to download a billing report source

---

## Technical Details

### Architecture

TimeUp is built as a client-side Trello Power-Up with no external server dependencies:

- **Pure JavaScript (ES6+)**: No frameworks or build steps required
- **Modular design**: Separation of concerns between services, UI, and utilities
- **Trello Storage API**: All data stored via `t.set()` and `t.get()`

### Project Structure

```
TimeUp/
├── index.html              # Power-Up connector
├── views/
│   └── card-section.html   # Embedded timer UI
├── src/
│   ├── main.js             # Capability registration
│   ├── config/
│   │   └── AppConfig.js    # Application configuration
│   ├── services/
│   │   ├── StorageService.js   # Trello storage abstraction
│   │   ├── TimerService.js     # Timer state machine
│   │   ├── TrelloService.js    # Trello API wrapper
│   │   └── ChecklistService.js # Checklist integration
│   ├── ui/
│   │   ├── TimerUI.js          # Timer controls
│   │   ├── EstimateUI.js       # Estimate input/display
│   │   ├── EntryListUI.js      # Time entry list
│   │   ├── ChecklistUI.js      # Checklist timers
│   │   ├── TimePickerUI.js     # Duration picker
│   │   ├── AuthUI.js           # Authorization UI
│   │   └── CardButtonUI.js     # Card button rendering
│   └── utils/
│       ├── constants.js        # App constants
│       ├── formatTime.js       # Time formatting
│       ├── escapeHtml.js       # XSS prevention
│       └── validators.js       # Input validation
└── styles/
    ├── variables.css           # CSS custom properties
    ├── base.css                # Base styles
    └── components.css          # Component styles
```

### Data Storage

Timer data is stored per-card using Trello's shared scope:

```javascript
{
  state: 'idle' | 'running' | 'paused',
  currentEntry: { startTime, pausedDuration } | null,
  estimatedTime: number | null,
  manualEstimateSet: boolean,
  totalTime: number,  // Aggregated total in milliseconds
  recentEntries: [],  // Editable entry history for reporting
  checklistTotals: {} // Per-item aggregated times
}
```

### Browser Compatibility

TimeUp supports all modern browsers:

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

---

## Development

### Prerequisites

- A Trello account
- A registered Power-Up at [trello.com/power-ups/admin](https://trello.com/power-ups/admin)
- A static file server (or GitHub Pages)

### Local Development

1. Clone the repository
2. Serve files locally (e.g., `npx serve .`)
3. Register a development Power-Up pointing to your local URL
4. Enable the Power-Up on a test board

### Contributing

Contributions are welcome. Please ensure:

- Code follows the existing style conventions
- All functions include JSDoc documentation
- CSS uses BEM naming convention
- No external dependencies are introduced

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

## Support

For issues, feature requests, or questions, please open an issue on the [GitHub repository](https://github.com/nikiitin/TimeUp).
