from pbkdf2 import crypt
import time

ITERATIONS = 800000

def hash(password):
    start = time.time()
    crypt(password, 'salt', ITERATIONS)
    end = time.time()
    return end - start

if __name__ == '__main__':
    for i in range(10):
        print(ITERATIONS, " -> ", hash('password'))
