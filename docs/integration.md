# Integration Examples

## WhatsApp Contact Integration
The WhatsApp integration allows users to directly message each other about parts using WhatsApp.

### Implementation
See `examples/whatsapp-contact.html` for a working example.

```html
<!-- Basic WhatsApp link format -->
https://wa.me/PHONENUMBER?text=YOUR_MESSAGE

<!-- Example with pre-filled message -->
https://wa.me/61421453444?text=Hi%2C%20I%27m%20interested%20in%20your%20part%20listing
```

### Phone Number Format
1. Start with the full phone number including country code
2. Remove any special characters (+, -, spaces)
3. Example:
   - Original: +61 421 453 444
   - Formatted: 61421453444

### URL Encoding
- Spaces: `%20`
- Apostrophes: `%27`
- Line breaks: `%0A`

### Best Practices
1. Always include country code
2. Pre-fill messages for better user experience
3. Keep messages concise
4. Consider adding part reference numbers in pre-filled messages
5. Test links on both mobile and desktop devices 