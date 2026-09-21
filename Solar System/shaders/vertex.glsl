varying vec3 vNormalWorld;
varying vec3 vWorldPosition;

void main() {
    // 1. Calculate world position of the vertex
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    // 2. Calculate world space normal vector (suitable for spheres)
    vNormalWorld = normalize(vec3(modelMatrix * vec4(normal, 0.0)));
    
    // 3. Project to clip space
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}