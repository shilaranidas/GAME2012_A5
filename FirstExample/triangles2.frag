#version 430 core

in vec4 colour;
in vec2 texCoord;
in vec3 normal;
in vec3 fragPos;
out vec4 frag_colour;

struct Light
{
	vec3 diffuseColour;
	float diffuseStrength;
};

struct AmbientLight
{
	vec3 ambientColour;
	float ambientStrength;
};

struct SpotLight
{
	Light base;
	vec3 position;
	vec3 direction;
	float edge;
};

struct Material
{
	float specularStrength;
	float shininess;
};

uniform sampler2D texture0;

uniform vec3 eyePosition;

uniform AmbientLight aLight;

uniform SpotLight sLight;

uniform Material mat;

vec4 calcLightByDirection(Light l, vec3 dir)
{
	float diffuseFactor = max(dot(normalize(normal),normalize(dir)), 0.0f); // Lambert's Cosine Law.
	vec4 diffuse = vec4(l.diffuseColour, 1.0f) * l.diffuseStrength * diffuseFactor;

	vec4 specular = vec4(0,0,0,0);
	if (diffuseFactor > 0.0f && l.diffuseStrength > 0.0f)
	{
		vec3 fragToEye = normalize(eyePosition - fragPos);
		vec3 reflectedVertex = normalize(reflect(dir, normalize(normal)));

		float specularFactor = dot(fragToEye, reflectedVertex);
		if (specularFactor > 0.0f)
		{
			specularFactor = pow(specularFactor, mat.shininess);
			specular = vec4(l.diffuseColour * mat.specularStrength * specularFactor, 1.0f);
		}
	}
	return (diffuse + specular);
}

vec4 calcSpotLight(SpotLight s)
{
	vec4 colour = vec4(0,0,0,0);
	vec3 rayDirection = normalize(fragPos - s.position);
	float slFactor = dot(rayDirection, s.direction);
	if (slFactor > s.edge)
	{
		vec3 direction = fragPos - s.position;
		float distance = length(direction);
		direction = normalize(direction);
		colour = calcLightByDirection(s.base, direction);
		colour *= (1.0f - (1.0f - slFactor) * (1.0f / (1.0f - s.edge)));
	}
	return colour;
}

void main()
{
	vec4 calcColour = vec4(0,0,0,1);
	
	vec4 ambient = vec4(aLight.ambientColour, 1.0f) * aLight.ambientStrength;
	calcColour += ambient;

	calcColour += calcSpotLight(sLight);
		
	frag_colour = texture(texture0, texCoord) * vec4(colour) * calcColour;
}