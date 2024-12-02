module default {
    type Note {
        required property title -> str;
        required property description -> str;
        required property userId -> str;
        required property tagId -> int16;
        optional property deleted -> bool {
            default := false;
        };
        optional property pinned -> bool {
            default := false;
        };
        required property timestamp -> datetime;
    }
}
