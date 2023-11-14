import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import type { UserData } from './mock';

// Create styles
const styles = StyleSheet.create({
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

// Create Document Component
export const MyDocument = ({ data }: { data: UserData }) => (
	<Document>
		<Page size="A4" style={styles.page}>
			<View style={styles.title}>
				<Text>{data.personal.fullName}</Text>
				{data.personal.age && <Text>, {data.personal.age}y.o.</Text>}
			</View>

			<View style={styles.contacts}>
				<Text style={styles.sectionTitle}>Contacts</Text>

				{data.contacts.phone && (
					<>
						<Text>Phone: </Text>
						<Text>{data.contacts.phone}</Text>
					</>
				)}

				{data.contacts.email && (
					<>
						<Text>Email: </Text>
						<Text>{data.contacts.email}</Text>
					</>
				)}

				{data.contacts.country && (
					<>
						<Text>Country: </Text>
						<Text>{data.contacts.country}</Text>
					</>
				)}

				{data.contacts.city && (
					<>
						<Text>City: </Text>
						<Text>{data.contacts.city}</Text>
					</>
				)}
			</View>

			<View style={styles.summary}>
				<Text>Summary</Text>
				{data.summary && <Text>{data.summary}</Text>}
			</View>
		</Page>
	</Document>
);
