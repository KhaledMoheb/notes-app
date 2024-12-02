module default {
  
  # Defining the Note type with its properties
  type Note {
    # Unique identifier for the note
    required property id -> uuid {
      constraint exclusive
    }
    
    # ID of the user who owns the note
    required property userId -> uuid
    
    # Title of the note
    required property title -> str
    
    # Description of the note
    required property description -> str
    
    # Tag ID associated with the note
    required property tagId -> int16
    
    # Indicates if the note is deleted (default: false)
    property deleted -> bool {
      default := false
    }
    
    # Indicates if the note is pinned (default: false)
    property pinned -> bool {
      default := false
    }
    
    # Timestamp of when the note was last modified or created
    required property timestamp -> datetime
  }
}
