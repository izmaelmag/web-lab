import { StyleSheet } from '@react-pdf/renderer';

// Create styles
export const styles = StyleSheet.create({
	page: {
		flexDirection: 'column',
		backgroundColor: '#E4E4E4'
	},

	section: {
		margin: 10,
		padding: 10,
		flexGrow: 1
	},

	title: {
		marginBottom: 24,
		fontSize: 36,
		fontWeight: 600
	},

	summary: {
		fontSize: 20,
		fontWeight: 500,
		lineHeight: 1.5,
		marginBottom: 24
	},

	contacts: {
		marginBottom: 24
	},

	sectionTitle: {
		fontSize: 28,
		fontWeight: 600,
		marginBottom: 16
	}
});
