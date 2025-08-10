# Essential Slide Builder Tools

## Priority 1: Core Tools (Must Have)

### 1. `addSlide`
**Purpose**: Create a new slide
**Parameters**:
- `content`: HTML string for slide content
- `position`: (optional) Index where to insert, defaults to end

### 2. `updateSlide`
**Purpose**: Edit existing slide content
**Parameters**:
- `slideIndex`: Which slide to update (0-based)
- `content`: New HTML content

### 3. `deleteSlide`
**Purpose**: Remove a slide
**Parameters**:
- `slideIndex`: Which slide to delete

### 4. `getSlideContent`
**Purpose**: Read current slide content
**Parameters**:
- `slideIndex`: Which slide to read
**Returns**: HTML string of slide content

## Priority 2: Navigation & Structure

### 5. `reorderSlide`
**Purpose**: Move slide to different position
**Parameters**:
- `fromIndex`: Current position
- `toIndex`: New position

### 6. `getCurrentSlideIndex`
**Purpose**: Get currently visible slide
**Returns**: Current slide index

### 7. `navigateToSlide`
**Purpose**: Jump to specific slide
**Parameters**:
- `slideIndex`: Target slide

## Priority 3: Batch Operations

### 8. `getAllSlides`
**Purpose**: Get all slides content
**Returns**: Array of HTML strings

### 9. `clearAllSlides`
**Purpose**: Remove all slides (with confirmation)

### 10. `duplicateSlide`
**Purpose**: Copy a slide
**Parameters**:
- `slideIndex`: Slide to duplicate

## Example Tool Calls

```javascript
// AI wants to add a title slide
{
  tool: "addSlide",
  parameters: {
    content: "<h1>Welcome</h1><p>To my presentation</p>"
  }
}

// AI wants to update slide 3
{
  tool: "updateSlide",
  parameters: {
    slideIndex: 2,
    content: "<h2>New Title</h2><ul><li>Point 1</li><li>Point 2</li></ul>"
  }
}

// AI wants to see what's on slide 5
{
  tool: "getSlideContent",
  parameters: {
    slideIndex: 4
  }
}
```

## Implementation Priority
Start with Priority 1 tools - these are the minimum viable set for a functional slide editor. Priority 2 adds navigation control, and Priority 3 enables more advanced operations.