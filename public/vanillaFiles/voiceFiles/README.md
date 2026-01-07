# Voice Files

This directory contains voice audio files for all 43 civilizations in Age of Empires II.

## Current Issue

The `.wem` files use Wwise encoding (proprietary Audiokinetic format) which is not natively supported by web browsers. While the files are technically RIFF WAVE containers, they use a non-standard codec (format code 0xFFFF) that browsers cannot decode.

## Solution: Convert to Browser-Compatible Format

To enable audio playback in browsers, the `.wem` files need to be converted to MP3 or OGG format.

### Conversion Script

You can use the following script to convert all voice files to MP3 format:

```bash
#!/bin/bash
# convert_voice_files.sh
# Requires: ffmpeg

for lang_dir in */; do
    lang_num="${lang_dir%/}"
    echo "Converting language $lang_num..."
    
    mkdir -p "${lang_dir}mp3"
    
    for wem_file in "${lang_dir}"*.wem; do
        if [ -f "$wem_file" ]; then
            filename=$(basename "$wem_file" .wem)
            # Try to convert using ffmpeg
            ffmpeg -i "$wem_file" -acodec libmp3lame -ab 128k "${lang_dir}mp3/${filename}.mp3" 2>/dev/null
            
            # If conversion succeeds, optionally replace original
            # mv "${lang_dir}mp3/${filename}.mp3" "${lang_dir}${filename}.mp3"
        fi
    done
done

echo "Conversion complete!"
```

### Alternative: Use vgmstream

If ffmpeg doesn't support the Wwise codec, you can use [vgmstream](https://github.com/vgmstream/vgmstream) which has better support for game audio formats:

```bash
# Install vgmstream (example for Ubuntu/Debian)
# sudo apt-get install vgmstream

for lang_dir in */; do
    for wem_file in "${lang_dir}"*.wem; do
        if [ -f "$wem_file" ]; then
            filename=$(basename "$wem_file" .wem)
            vgmstream-cli -o "${lang_dir}${filename}.wav" "$wem_file"
            # Then convert WAV to MP3
            ffmpeg -i "${lang_dir}${filename}.wav" -acodec libmp3lame -ab 128k "${lang_dir}${filename}.mp3"
            rm "${lang_dir}${filename}.wav"
        fi
    done
done
```

### After Conversion

1. Update `voiceFilesMap.json` to reference `.mp3` files instead of `.wem`
2. Update the MIME type configuration in `server.js` if needed
3. Test audio playback in various browsers

## Current Workaround

The language selector is set to muted by default. Users can click the unmute button (🔇) to attempt playback, but it will only work if their browser supports the specific codec used in these files.
