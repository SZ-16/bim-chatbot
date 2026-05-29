import os
import psycopg2
import random
import PyPDF2
import docx


def extract_text_from_file(filepath: str) -> str:
    """
    Detects the file extension and extracts raw text from PDF, DOCX, or TXT.
    """
    _, file_extension = os.path.splitext(filepath)
    file_extension = file_extension.lower()
    extracted_text = ""

    try:
        if file_extension == '.txt':
            with open(filepath, 'r', encoding='utf-8') as file:
                extracted_text = file.read()

        elif file_extension == '.pdf':
            with open(filepath, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    # Extract text and add a space to avoid words squishing together
                    page_text = page.extract_text()
                    if page_text:
                        extracted_text += page_text + " "

        elif file_extension == '.docx':
            doc = docx.Document(filepath)
            for paragraph in doc.paragraphs:
                extracted_text += paragraph.text + "\n"

        else:
            print(f"Error: Unsupported file type '{file_extension}'")

    except Exception as e:
        print(f"Error reading {filepath}: {e}")

    return extracted_text


def chunk_document(filepath: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Extracts text from any supported file and splits it into smaller chunks with overlap.
    """
    if not os.path.exists(filepath):
        print(f"Error: Could not find the file at {filepath}")
        return []

    # Use our new smart extraction function
    text = extract_text_from_file(filepath)

    if not text.strip():
        print("Warning: No text could be extracted from the file.")
        return []

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
    # 1. Extract and Chunk the file
    # You can change this to point to a .pdf or .docx file!
    file_path = "../lab3.pdf" # Test pdf this can be changed
    document_chunks = chunk_document(file_path)

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