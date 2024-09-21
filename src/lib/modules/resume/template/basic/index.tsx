import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import type { Resume } from '../../../../types/resume';

// Create styles
const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35
  },

  title: {
    fontSize: 36,
    marginBottom: 4,
    flexDirection: 'row'
  },

  position: {
    fontSize: 18,
    marginBottom: 18,
    flexDirection: 'row'
  },

  summary: {
    fontSize: 14,
    lineHeight: 1.33,
    marginBottom: 24
  },

  section: {
    marginBottom: 16
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 10
  },

  label: {
    fontWeight: 700
  },

  contact: {
    fontSize: 14,
    flexDirection: 'row',
    marginBottom: 8
  }
});

// Create Document Component
export const BasicTemplate = ({ data }: { data: Resume }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.title}>
        <Text>{data.fullName}</Text>
      </View>

      <View style={styles.position}>
        {data.position && <Text>{data.position}</Text>}
        {data.age && <Text>, {data.age}y.o.</Text>}
      </View>

      <View style={styles.summary}>
        <Text style={styles.sectionTitle}>Summary</Text>
        {data.summary && <Text>{data.summary}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contacts</Text>

        {data.email && (
          <View style={styles.contact}>
            <Text style={styles.label}>Email: </Text>
            <Text>{data.email}</Text>
          </View>
        )}

        {data.phone && (
          <View style={styles.contact}>
            <Text style={styles.label}>Phone: </Text>
            <Text>{data.phone}</Text>
          </View>
        )}

        {data.country && (
          <View style={styles.contact}>
            <Text style={styles.label}>Country: </Text>
            <Text>{data.country}</Text>
          </View>
        )}

        {data.city && (
          <View style={styles.contact}>
            <Text style={styles.label}>City: </Text>
            <Text>{data.city}</Text>
          </View>
        )}
      </View>
    </Page>
  </Document>
);
