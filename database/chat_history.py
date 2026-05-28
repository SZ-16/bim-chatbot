import os
import psycopg2
from typing import List, Dict


def get_chat_history(session_id: str, limit: int = 5) -> List[Dict[str, str]]:
    """
    Returns the last 'limit' messages for a given session from a PostgreSQL database,
    formatted exactly for the OpenRouter API.
    """
    # Fetch the database URL from the Environment Variables
    db_url = os.getenv("DATABASE_URL")

    if not db_url:
        print("Error: DATABASE_URL environment variable is not set.")
        return []

    try:
        # Open a connection to the database
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()

        # Query to fetch the newest messages up to the limit,
        # then sort them chronologically (oldest to newest)
        query = """
            SELECT role, content 
            FROM (
                SELECT role, content, timestamp 
                FROM messages 
                WHERE session_id = %s 
                ORDER BY timestamp DESC 
                LIMIT %s
            ) AS subquery
            ORDER BY timestamp ASC;
        """

        # Execute the query securely using parameterized inputs (%s)
        cursor.execute(query, (session_id, limit))
        rows = cursor.fetchall()

        # Format the result into the requested list of dictionaries
        chat_history = [{"role": row[0], "content": row[1]} for row in rows]

        # Clean up database connections
        cursor.close()
        conn.close()

        return chat_history

    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        return []
