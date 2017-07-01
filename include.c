/*  include.c
    Douglas Crockford
    2017-06-29
*/

#include <stdio.h>

static char pattern[] = "@include ";
static int pattern_length = 8;

static int pair(int opener) {
/*
    We allow the key to be wrapped by any of these pairs:
        " "     ' '     < >     ( )     [ ]     { }
*/
    switch (opener) {
    case '"':
        return '"';
    case '\'':
        return '\'';
    case '<':
        return '>';
    case '(':
        return ')';
    case '[':
        return ']';
    case '{':
        return '}';
    default:
        return 0;
    }
}

static void include(FILE *input, FILE *output) {
/*
    The include function replaces @include expressions with the contents of
    files. If there are no @include expressions, then the input is simply
    copied to the output.

    The input may have embedded zero or more of

        @include "filename"

    If the '@include' is preceded by an odd number of '@', then it does not
    match.

    There can be 0 or 1 spaces between the @include and the opening of the
    filename. This function will replace each with the contents of the named
    file. A filename must be wrapped in any of these six pairs:

        " "     ' '     < >     ( )     [ ]     { }

    The filename may not itself contain an @include. The first character in
    the filename may not be

        .   /   \   space

    Backslashes are literal in the filename. It is not a C string.

    The file will be opened in the current directory. An inclusion may contain
    more @include commands. There is no protection against infinite loops, so
    be careful out there.
*/
    int character;
    int closer;
    int f;
    char filename[257];
    int filename_length;
    int found = 0;
    FILE *inclusion;
    int length;
    int opener;

    while (1) {
        character = fgetc(input);
        if (character == EOF) {
            return;
        }
        if (character == pattern[0]) {
            character = fgetc(input);
/*
    If we see '@@', output them.
*/
            if (character == pattern[0]) {
                fputc(pattern[0], output);
                fputc(pattern[0], output);
/*
    If we see '@@', output them.
*/
            } else if (character == EOF) {
                fputc(pattern[0], output);
                return;
/*
    If we see '@i' then we might have the start of the pattern.
    It just got real.
*/
            } else if (character == pattern[1]) {
                found = 1;
                filename_length = 0;
                opener = 0;
/*
        Try to match the rest of the pattern.
*/
                for (length = 2; length < pattern_length; length += 1) {
                    character = fgetc(input);
                    if (character != pattern[length]) {
                        found = 0;
                        break;
                    }
                }
                if (found) {
                    character = fgetc(input);
/*
        The space between the pattern and the opener is optional.
*/
                    if (character == ' ') {
                        length += 1;
                        character = fgetc(input);
                    }
/*
        The next character must be one of the six openers.
*/
                    opener = character;
                    closer = pair(character);
                    if (closer) {
/*
        We have an opener, and we know the closer. Move characters into the
        filename until we see the closer.
*/
                        while (1) {
                            character = fgetc(input);
                            if (character < ' ') {
                                found = 0;
                                break;
                            }
                            if (character == closer) {
                                found = 1;
                                break;
                            }
                            filename[filename_length] = character;
                            filename_length += 1;
                            if (filename_length >= 256) {
                                character = 0;
                                found = 0;
                                break;
                            }
                        }
                        filename[filename_length] = 0;
                        f = filename[0];
/*
        We found the closer. We have a filename. But we will reject a name
        starting with
            .   /   \
        or space.
*/
                        if (
                            found
                            && f > ' '
                            && f != '.'
                            && f != '/'
                            && f != '\\'
                        ) {
/*
        If we can open the file in the current directory, then call include
        recursively to process it.
*/
                            inclusion = fopen(filename, "r");
                            if (inclusion != NULL) {
                                include(inclusion, output);
                                fclose(inclusion);
                            } else {
                                found = 0;
                            }
                        } else {
                            found = 0;
                        }
                    } else {
                        opener = 0;
                        found = 0;
                    }
                }
/*
    If for any reason the include did not work, then send all of the characters
    we touched to the output.
*/
                if (!found) {
                    fwrite(pattern, 1, length, output);
                    if (opener) {
                       fputc(opener, output);
                        fwrite(
                            filename,
                            1,
                            filename_length,
                            output
                        );
                    }
                    if (character > 0) {
                       fputc(character, output);
                    }
                }
/*
    We saw '@' followed by a random character.
*/
            } else {
               fputc(pattern[0], output);
               fputc(character, output);
            }
/*
    We saw a character that was not '@'.
*/
        } else {
           fputc(character, output);
        }
    }
}

int main(int argc, char* argv[]) {
    include(stdin, stdout);
}
