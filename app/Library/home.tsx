import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import books from '../../books.json';

interface Book {
  id: string;
  title: string;
  description: string;
}

// 图片映射：id => 本地图像
const imageMap: Record<string, any> = {
  'book_001': require('../../assets/images/1.png'),
  'book_002': require('../../assets/images/2.png'),
  'book_003': require('../../assets/images/3.png'),
  'book_004': require('../../assets/images/4.png'),
  'book_005': require('../../assets/images/5.png'),
  'book_006': require('../../assets/images/6.png'),
  'book_007': require('../../assets/images/7.png'),
  'book_008': require('../../assets/images/8.png'),
  'book_009': require('../../assets/images/9.png'),
  'book_010': require('../../assets/images/10.png'),
  'book_011': require('../../assets/images/11.png'),
  'book_012': require('../../assets/images/12.png')
};

export default function LibraryHomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedBooks, setDisplayedBooks] = useState<Book[]>([]);

  useEffect(() => {
    const sortedBooks = [...books].sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    setDisplayedBooks(sortedBooks);
  }, []);

  const filteredBooks = displayedBooks.filter((book) => {
    const query = searchQuery.trim().toLowerCase();
    return (
      book.title.toLowerCase().includes(query) ||
      book.description.toLowerCase().includes(query)
    );
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Digital Library</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search books..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {filteredBooks.length === 0 && searchQuery.trim() !== '' ? (
        <Text style={{ marginTop: 20 }}>No books found.</Text>
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/Library/bookdetail',
                  params: { book: JSON.stringify(item) }
                })
              }
            >
              <Image
                source={imageMap[item.id]}
                style={styles.cover}
              />
              <Text style={styles.bookTitle}>{item.title}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    borderRadius: 8,
    paddingHorizontal: 12
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16
  },
  card: {
    width: '48%',
    alignItems: 'center'
  },
  cover: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    resizeMode: 'cover'
  },
  bookTitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 20
  }
});