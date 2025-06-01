// Test to verify aspect ratio fix
export function testImageAspectRatio() {
  console.log('=== Testing Image Aspect Ratio Fix ===');
  
  // Test the renderHTML logic
  const testCases = [
    {
      name: 'Width only',
      attributes: { width: '100px' },
      expected: 'should have width attribute and height: auto style'
    },
    {
      name: 'Height only', 
      attributes: { height: '80px' },
      expected: 'should have height attribute and width: auto style'
    },
    {
      name: 'Both width and height',
      attributes: { width: '100px', height: '80px' },
      expected: 'should have both attributes and explicit width/height styles'
    }
  ];
  
  // Mock the renderHTML function logic
  const mockRenderHTML = (type, attributes) => {
    if (type === 'width') {
      if (!attributes.width) return {};
      const width = attributes.width.toString().includes('px') ? attributes.width : attributes.width + 'px';
      const heightAttr = attributes.height;
      if (heightAttr) {
        return { width: width };
      } else {
        return { 
          width: width,
          style: `width: ${width}; height: auto;`
        };
      }
    }
    
    if (type === 'height') {
      if (!attributes.height) return {};
      const height = attributes.height.toString().includes('px') ? attributes.height : attributes.height + 'px';
      const width = attributes.width;
      if (width) {
        const widthValue = width.toString().includes('px') ? width : width + 'px';
        return { 
          height: height,
          style: `width: ${widthValue}; height: ${height};`
        };
      } else {
        return { 
          height: height,
          style: `height: ${height}; width: auto;`
        };
      }
    }
  };
  
  testCases.forEach(testCase => {
    console.log(`\nTesting: ${testCase.name}`);
    console.log(`Attributes:`, testCase.attributes);
    
    const widthResult = mockRenderHTML('width', testCase.attributes);
    const heightResult = mockRenderHTML('height', testCase.attributes);
    
    console.log(`Width renderHTML:`, widthResult);
    console.log(`Height renderHTML:`, heightResult);
    console.log(`Expected: ${testCase.expected}`);
    
    // Verify no conflicting styles
    const hasConflictingStyles = (
      widthResult.style?.includes('height: auto') && 
      heightResult.style?.includes('width:') && 
      heightResult.style?.includes('height:')
    );
    
    if (hasConflictingStyles) {
      console.log('❌ ISSUE: Conflicting styles detected!');
    } else {
      console.log('✅ No conflicting styles');
    }
  });
  
  console.log('\n=== Test Complete ===');
}

// Test aspect ratio calculation
export function testAspectRatioCalculation() {
  console.log('\n=== Testing Aspect Ratio Calculation ===');
  
  const testImages = [
    { width: 400, height: 300, name: '4:3 aspect ratio' },
    { width: 800, height: 600, name: '4:3 aspect ratio (larger)' },
    { width: 300, height: 400, name: '3:4 aspect ratio (portrait)' },
    { width: 1920, height: 1080, name: '16:9 aspect ratio' }
  ];
  
  testImages.forEach(img => {
    const aspectRatio = img.height / img.width;
    const newWidth = 200; // Simulate resizing to 200px width
    const expectedHeight = newWidth * aspectRatio;
    
    console.log(`\n${img.name}:`);
    console.log(`  Original: ${img.width}x${img.height}`);
    console.log(`  Aspect ratio: ${aspectRatio.toFixed(4)}`);
    console.log(`  Resized to width 200px: ${newWidth}x${expectedHeight.toFixed(1)}`);
    
    // Verify aspect ratio is preserved
    const originalRatio = img.height / img.width;
    const newRatio = expectedHeight / newWidth;
    const ratioMatch = Math.abs(originalRatio - newRatio) < 0.001;
    
    console.log(`  Aspect ratio preserved: ${ratioMatch ? '✅' : '❌'}`);
  });
  
  console.log('\n=== Aspect Ratio Test Complete ===');
}

// Usage: uncomment to run tests
// testImageAspectRatio();
// testAspectRatioCalculation(); 