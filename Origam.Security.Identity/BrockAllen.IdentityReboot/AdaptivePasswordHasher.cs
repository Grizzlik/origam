﻿using BrockAllen.IdentityReboot.Internal;
using Microsoft.AspNet.Identity;
using System;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Runtime.CompilerServices;

namespace BrockAllen.IdentityReboot
{
    public class AdaptivePasswordHasher : IPasswordHasher
    {
        public const char PASSWORD_HASHING_ITERATION_COUNT_SEPARATOR = '.';

        public int IterationCount { get; set; }

        public AdaptivePasswordHasher()
        {
        }

        public AdaptivePasswordHasher(int iterations)
        {
            if (iterations <= 0)
            {
                throw new ArgumentException("Invalid iterations");
            }
            this.IterationCount = iterations;
        }

        private static string HashPasswordInternal(string password, int count)
        {
            var result = Crypto.HashPassword(password, count);
            return result;
        }

        private static bool VerifyHashedPasswordInternal(
            string hashedPassword, string providedPassword, int count)
        {
            var result = Crypto.VerifyHashedPassword(
                hashedPassword, providedPassword, count);
            return result;
        }

        int GetIterationCount()
        {
            var count = IterationCount;
            if (count <= 0)
            {
                count = GetIterationsFromYear(GetCurrentYear());
            }
            return count;
        }

        public string HashPassword(string password)
        {
            int count = GetIterationCount();
            var result = HashPasswordInternal(password, count);
            return EncodeIterations(count) 
                + PASSWORD_HASHING_ITERATION_COUNT_SEPARATOR + result;
        }

        public virtual PasswordVerificationResult VerifyHashedPassword(
            string hashedPassword, string providedPassword)
        {
            if (!String.IsNullOrWhiteSpace(hashedPassword))
            {
                if (hashedPassword.Contains(
                    PASSWORD_HASHING_ITERATION_COUNT_SEPARATOR))
                {
                    var parts = hashedPassword.Split(
                        PASSWORD_HASHING_ITERATION_COUNT_SEPARATOR);
                    if (parts.Length != 2) return PasswordVerificationResult.Failed;
                    int count = DecodeIterations(parts[0]);
                    if (count <= 0)
                    {
                        return PasswordVerificationResult.Failed;
                    }
                    hashedPassword = parts[1];
                    if (VerifyHashedPasswordInternal(
                        hashedPassword, providedPassword, count))
                    {
                        return GetIterationCount() != count 
                            ? PasswordVerificationResult.SuccessRehashNeeded 
                            : PasswordVerificationResult.Success;
                    }
                }
                else if (Crypto.VerifyHashedPassword(
                    hashedPassword, providedPassword))
                {
                    return PasswordVerificationResult.SuccessRehashNeeded;
                }
            }
            return PasswordVerificationResult.Failed;
        }

        public string EncodeIterations(int count)
        {
            return count.ToString("X");
        }

        public int DecodeIterations(string prefix)
        {
            int val;
            if (Int32.TryParse(prefix, NumberStyles.HexNumber, null, out val))
            {
                return val;
            }
            return -1;
        }

        // from OWASP : https://www.owasp.org/index.php/Password_Storage_Cheat_Sheet
        const int START_YEAR = 2000;
        const int START_COUNT = 1000;

        public int GetIterationsFromYear(int year)
        {
            if (year > START_YEAR)
            {
                var diff = (year - START_YEAR) / 2;
                var mul = (int)Math.Pow(2, diff);
                int count = START_COUNT * mul;
                // if we go negative, then we wrapped (expected in year ~2044). 
                // Int32.Max is best we can do at this point
                if (count < 0) count = Int32.MaxValue;
                return count;
            }
            return START_COUNT;
        }

        [MethodImpl(MethodImplOptions.NoOptimization)]
        internal static bool SlowEqualsInternal(string a, string b)
        {
            if (Object.ReferenceEquals(a, b))
            {
                return true;
            }
            if ((a == null) || (b == null) || (a.Length != b.Length))
            {
                return false;
            }
            bool same = true;
            for (var i = 0; i < a.Length; i++)
            {
                same &= (a[i] == b[i]);
            }
            return same;
        }

        public virtual int GetCurrentYear()
        {
            return DateTime.Now.Year;
        }
    }
}