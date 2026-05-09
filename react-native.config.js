module.exports = {
	project: {
		ios: {},
		android: {},
	},
	dependencies: {
		"@react-native-vector-icons/ionicons": {
			platforms: {
				ios: null,
			},
		},
	},
	assets: [
		"./src/assets/fonts/",
		"./node_modules/@react-native-vector-icons/ionicons/fonts",
	],
};