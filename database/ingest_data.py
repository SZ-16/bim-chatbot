import os
import psycopg2
import random


def chunk_text_file(filepath: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Reads a text file and splits it into smaller chunks with overlap.
    """
    if not os.path.exists(filepath):
        print(f"Error: Could not find the file at {filepath}")
        return []

    with open(filepath, 'r', encoding='utf-8') as file:
        text = file.read()

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += (chunk_size - overlap)

    return chunks


def generate_mock_embedding(dimensions: int = 1536) -> list[float]:
    """
    Generates a list of random floats between -1.0 and 1.0.
    This simulates what an AI (like OpenAI) returns.
    """
    return [random.uniform(-1.0, 1.0) for _ in range(dimensions)]


# --- INGESTION SCRIPT ---
if __name__ == "__main__":
    # 1. Chunk the file
    file_path = "../bim_data.txt"  # Change this if your file is in a different folder
    document_chunks = chunk_text_file(file_path)

    if not document_chunks:
        print("Stopping: No chunks generated.")
    else:
        print(f"Generated {len(document_chunks)} chunks. Connecting to database...")

        # 2. Connect to the database
        db_url = os.getenv("DATABASE_URL")

        if not db_url:
            print("Error: DATABASE_URL environment variable is missing.")
        else:
            try:
                conn = psycopg2.connect(db_url)
                cursor = conn.cursor()

                print("Uploading chunks and mock vectors to Neon...")

                # 3. Loop through chunks, generate mock vectors, and insert them
                for chunk in document_chunks:
                    mock_vector = generate_mock_embedding()

                    # pgvector expects vectors as a string format: '[0.1, 0.2, ...]'
                    vector_string = str(mock_vector)

                    insert_query = """
                        INSERT INTO bim_documents (document_name, chunk_text, embedding)
                        VALUES (%s, %s, %s);
                    """

                    cursor.execute(insert_query, (file_path, chunk, vector_string))

                # 4. Commit the changes
                conn.commit()
                print("Success! All data inserted into the Vector Database.")

                cursor.close()
                conn.close()

            except psycopg2.Error as e:
                print(f"Database Error: {e}")