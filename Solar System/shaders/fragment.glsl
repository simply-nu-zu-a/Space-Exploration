uniform vec3 atmosphereDayColor;
uniform vec3 atmosphereTwilightColor;
uniform vec3 uLightDirection; // Normalized direction vector pointing to the sun

varying vec3 vNormalWorld;
varying vec3 vWorldPosition;

void main() {
    // 1. View direction pointing from camera to the vertex in world space
    // (cameraPosition is automatically provided as a built-in uniform in THREE.ShaderMaterial)
    vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
    
    // 2. Normalize the world normal
    vec3 normalWorld = normalize(vNormalWorld);
    
    // 3. Calculate Fresnel effect (1.0 at outer edge silhouette, 0.0 at center)
    // Using abs() ensures it handles BackSide rendering geometry correctly
    float fresnel = 1.0 - abs(dot(viewDirection, normalWorld));
    
    // 4. Sun orientation (dot product between surface normal and sun direction)
    float sunOrientation = dot(normalWorld, uLightDirection);
    
    // 5. Mix twilight and day colors based on sun orientation
    float dayMix = smoothstep(-0.25, 0.75, sunOrientation);
    vec3 atmosphereColor = mix(atmosphereTwilightColor, atmosphereDayColor, dayMix);
    
    // 6. Calculate alpha: Remap fresnel from [0.73, 1.0] to [1.0, 0.0] and apply power of 3
    // This creates a smooth fade-out at the very edge of the scaled sphere
    float remappedFresnel = clamp((fresnel - 0.73) / (1.0 - 0.73), 0.0, 1.0);
    float alpha = pow(1.0 - remappedFresnel, 1.5);
    
    // 7. Fade out atmosphere on the night side
    alpha *= smoothstep(-0.5, 1.0, sunOrientation);
    
    gl_FragColor = vec4(atmosphereColor, alpha);
}